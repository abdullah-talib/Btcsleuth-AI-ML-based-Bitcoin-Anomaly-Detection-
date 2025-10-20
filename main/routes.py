import os
import json
from datetime import datetime, timedelta
from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify, send_file, current_app
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename
from models import Analysis, ActivityLog, Alert, User
from app import db
from utils.helpers import allowed_file, log_activity, create_alert, send_email
from ml.analyzer import MLAnalyzer
import pandas as pd
import pytz

main_bp = Blueprint('main', __name__)
 
# Forms for settings
from auth.forms import UpdateProfileForm, ChangePasswordForm, DeleteAccountForm

@main_bp.route('/')
def index():
    return render_template('index.html')

@main_bp.route('/dashboard')
@login_required
def dashboard():
    # Get dashboard statistics
    total_analyses = Analysis.query.filter_by(user_id=current_user.id).count()
    total_anomalies = db.session.query(db.func.sum(Analysis.anomalies_detected)).filter_by(user_id=current_user.id).scalar() or 0
    
    # Recent analyses
    recent_analyses = Analysis.query.filter_by(user_id=current_user.id).order_by(Analysis.created_at.desc()).all()
    
    # Recent alerts
    recent_alerts = Alert.query.filter_by(user_id=current_user.id).order_by(Alert.created_at.desc()).limit(5).all()
    
    # Activity logs
    recent_activities = ActivityLog.query.filter_by(user_id=current_user.id).order_by(ActivityLog.timestamp.desc()).limit(10).all()
    
    # Chart data for the last 30 days
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    analyses_data = Analysis.query.filter(
        Analysis.user_id == current_user.id,
        Analysis.created_at >= thirty_days_ago
    ).all()
    
    # Prepare chart data
    chart_data = {}
    for analysis in analyses_data:
        date_str = analysis.created_at.strftime('%Y-%m-%d')
        if date_str not in chart_data:
            chart_data[date_str] = {'analyses': 0, 'anomalies': 0}
        chart_data[date_str]['analyses'] += 1
        chart_data[date_str]['anomalies'] += analysis.anomalies_detected
    
    # If no data, add today with 0s
    if not chart_data:
        today_str = datetime.utcnow().strftime('%Y-%m-%d')
        chart_data[today_str] = {'analyses': 0, 'anomalies': 0}
    
    # Fill in all dates for the last 30 days
    date_list = [(datetime.utcnow() - timedelta(days=i)).strftime('%Y-%m-%d') for i in range(29, -1, -1)]
    for date_str in date_list:
        if date_str not in chart_data:
            chart_data[date_str] = {'analyses': 0, 'anomalies': 0}
    # Sort chart_data by date
    chart_data = {date: chart_data[date] for date in sorted(chart_data)}
    
    return render_template('dashboard/main.html', 
                         total_analyses=total_analyses,
                         total_anomalies=total_anomalies,
                         recent_analyses=recent_analyses,
                         recent_alerts=recent_alerts,
                         recent_activities=recent_activities,
                         chart_data=json.dumps(chart_data))

@main_bp.route('/upload', methods=['GET', 'POST'])
@login_required
def upload():
    if request.method == 'POST':
        if 'file' not in request.files:
            flash('No file selected', 'error')
            return redirect(request.url)
        
        file = request.files['file']
        if file.filename == '':
            flash('No file selected', 'error')
            return redirect(request.url)
        
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S_')
            filename = timestamp + filename
            
            filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            
            # Validate CSV schema before analysis
            import pandas as pd
            try:
                df_head = pd.read_csv(filepath, nrows=5)
            except Exception as e:
                os.remove(filepath)
                flash(f'Invalid CSV file: {str(e)}', 'error')
                return redirect(request.url)

            # Accept either (price & qty) or (close & volume)
            has_price_qty = ('price' in df_head.columns and 'qty' in df_head.columns)
            has_close_volume = ('close' in df_head.columns and 'volume' in df_head.columns)
            if not (has_price_qty or has_close_volume):
                os.remove(filepath)
                flash('Invalid CSV headers. Expected columns: price & qty OR close & volume.', 'error')
                return redirect(request.url)

            # Log activity
            log_activity(current_user.id, 'File Upload', f'Uploaded file: {filename}')
            
            # Process the file
            analyzer = MLAnalyzer()
            try:
                results = analyzer.analyze_csv(filepath)
                
                # Save analysis results
                analysis = Analysis(
                    user_id=current_user.id,
                    analysis_type='upload',
                    filename=filename,
                    total_transactions=results['total_transactions'],
                    anomalies_detected=results['anomalies_detected'],
                    accuracy_score=results['accuracy_score'],
                    results=json.dumps(results)
                )
                db.session.add(analysis)
                db.session.commit()
                
                # Create alert if anomalies detected
                if results['anomalies_detected'] > 0:
                    create_alert(current_user.id, 'anomaly', 
                               f"Detected {results['anomalies_detected']} anomalies in uploaded file", 
                               'high')
                
                flash('File analyzed successfully!', 'success')
                return redirect(url_for('main.results', analysis_id=analysis.id))
                
            except Exception as e:
                flash(f'Error analyzing file: {str(e)}', 'error')
                log_activity(current_user.id, 'Analysis Error', f'Error analyzing file {filename}: {str(e)}')
        else:
            flash('Invalid file type. Please upload a CSV file.', 'error')
    
    return render_template('dashboard/upload.html')

@main_bp.route('/results/<int:analysis_id>')
@login_required
def results(analysis_id):
    analysis = Analysis.query.filter_by(id=analysis_id, user_id=current_user.id).first_or_404()
    results_data = json.loads(analysis.results) if analysis.results else {}
    # Convert to Asia/Karachi timezone
    local_tz = pytz.timezone('Asia/Karachi')
    if analysis.created_at.tzinfo is None:
        created_utc = pytz.utc.localize(analysis.created_at)
    else:
        created_utc = analysis.created_at.astimezone(pytz.utc)
    analysis_local_created_at = created_utc.astimezone(local_tz)
    return render_template('dashboard/results.html', analysis=analysis, results=results_data, analysis_local_created_at=analysis_local_created_at)

@main_bp.route('/results')
@login_required
def results_blank():
    return render_template('dashboard/results.html', analysis=None, results={})

@main_bp.route('/live-analysis')
@login_required
def live_analysis():
    return render_template('dashboard/live-analysis.html')

@main_bp.route('/activity-logs')
@login_required
def activity_logs():
    page = request.args.get('page', 1, type=int)
    logs = ActivityLog.query.filter_by(user_id=current_user.id).order_by(
        ActivityLog.timestamp.desc()).paginate(
        page=page, per_page=20, error_out=False)

    # Count today's activities
    now = datetime.now()
    yesterday = now - timedelta(days=1)
    todays_activities_count = len([log for log in logs.items if log.timestamp > yesterday])

    # Build filtered_args for pagination
    filtered_args = {k: v for k, v in request.args.items() if k != 'page'}

    return render_template('dashboard/activity-logs.html', logs=logs, todays_activities_count=todays_activities_count, filtered_args=filtered_args)

@main_bp.route('/settings', methods=['GET', 'POST'])
@login_required
def settings():
    profile_form = UpdateProfileForm()
    password_form = ChangePasswordForm()
    delete_form = DeleteAccountForm()

    # Pre-fill profile form on GET
    if request.method == 'GET':
        profile_form.username.data = current_user.username
        profile_form.email.data = current_user.email

    # Handle profile update
    if 'profile_submit' in request.form and profile_form.validate_on_submit():
        new_username = profile_form.username.data.strip()
        new_email = profile_form.email.data.strip().lower()

        # Check uniqueness
        existing_username = User.query.filter(User.username == new_username, User.id != current_user.id).first()
        existing_email = User.query.filter(User.email == new_email, User.id != current_user.id).first()
        if existing_username:
            flash('Username already taken.', 'error')
        elif existing_email:
            flash('Email already registered.', 'error')
        else:
            old_username = current_user.username
            old_email = current_user.email
            current_user.username = new_username
            current_user.email = new_email
            db.session.commit()
            log_activity(current_user.id, 'Profile Updated', f"Username: {old_username} -> {new_username}, Email: {old_email} -> {new_email}")
            flash('Profile updated successfully.', 'success')
            return redirect(url_for('main.settings'))

    # Handle password change
    if 'password_submit' in request.form and password_form.validate_on_submit():
        if not current_user.check_password(password_form.current_password.data):
            flash('Current password is incorrect.', 'error')
        else:
            current_user.set_password(password_form.new_password.data)
            db.session.commit()
            log_activity(current_user.id, 'Password Changed', 'User changed their password.')
            flash('Password changed successfully.', 'success')
            return redirect(url_for('main.settings'))

    # Handle account deletion
    if 'delete_submit' in request.form and delete_form.validate_on_submit():
        if not current_user.check_password(delete_form.password.data):
            flash('Password is incorrect.', 'error')
        else:
            user_id = current_user.id
            username = current_user.username

            # Delete related data
            Analysis.query.filter_by(user_id=user_id).delete()
            ActivityLog.query.filter_by(user_id=user_id).delete()
            Alert.query.filter_by(user_id=user_id).delete()

            # Delete the user
            user = User.query.get(user_id)
            from flask_login import logout_user
            logout_user()
            db.session.delete(user)
            db.session.commit()
            flash('Your account has been deleted.', 'info')
            # Cannot log_activity after deletion; use print for server log
            try:
                print(f"User deleted: {username} (ID {user_id})")
            except Exception:
                pass
            return redirect(url_for('main.index'))

    return render_template('dashboard/settings.html', 
                           profile_form=profile_form,
                           password_form=password_form,
                           delete_form=delete_form)

@main_bp.route('/api/user-analysis-activity')
@login_required
def user_analysis_activity():
    from datetime import datetime, timedelta
    analysis_types = ['upload', 'live', 'testnet']
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    analyses_data = Analysis.query.filter(
        Analysis.user_id == current_user.id,
        Analysis.created_at >= thirty_days_ago
    ).all()
    # Prepare line chart data
    chart_data = {}
    # Prepare stacked bar data
    stacked_data = {}
    # Fill in all dates for the last 30 days
    date_list = [(datetime.utcnow() - timedelta(days=i)).strftime('%Y-%m-%d') for i in range(29, -1, -1)]
    for date_str in date_list:
        chart_data[date_str] = {'analyses': 0, 'anomalies': 0}
        stacked_data[date_str] = {atype: 0 for atype in analysis_types}
    for analysis in analyses_data:
        date_str = analysis.created_at.strftime('%Y-%m-%d')
        chart_data[date_str]['analyses'] += 1
        chart_data[date_str]['anomalies'] += analysis.anomalies_detected
        if analysis.analysis_type in analysis_types:
            stacked_data[date_str][analysis.analysis_type] += 1
    # Sort chart_data and stacked_data by date
    chart_data = {date: chart_data[date] for date in sorted(chart_data)}
    stacked_data = {date: stacked_data[date] for date in sorted(stacked_data)}
    return jsonify({'success': True, 'chart_data': chart_data, 'stacked_data': stacked_data, 'analysis_types': analysis_types})

@main_bp.route('/api/user-analyses', methods=['DELETE'])
@login_required
def clear_user_analyses():
    from models import Analysis
    Analysis.query.filter_by(user_id=current_user.id).delete()
    db.session.commit()
    return jsonify({'success': True})

@main_bp.route('/api/user-activity-logs', methods=['DELETE'])
@login_required
def clear_user_activity_logs():
    from models import ActivityLog
    ActivityLog.query.filter_by(user_id=current_user.id).delete()
    db.session.commit()
    return jsonify({'success': True})

@main_bp.route('/download-report/<int:analysis_id>')
@login_required
def download_report(analysis_id):
    analysis = Analysis.query.filter_by(id=analysis_id, user_id=current_user.id).first_or_404()
    
    # Generate report
    from utils.helpers import generate_report
    report_path = generate_report(analysis, user_email=current_user.email, download_time=datetime.now())
    
    # Check if report generation failed
    if report_path is None:
        flash('Error generating report. Please try again.', 'error')
        return redirect(url_for('main.results', analysis_id=analysis_id))
    
    log_activity(current_user.id, 'Report Download', f'Downloaded report for analysis {analysis_id}')
    
    # Create filename with analysis type
    analysis_type = analysis.analysis_type.title()
    filename = f"{analysis_type}_Analysis_Report_{analysis_id}.pdf"
    
    return send_file(report_path, as_attachment=True, 
                     download_name=filename)

@main_bp.route('/api/send-anomaly-email', methods=['POST'])
@login_required
def send_anomaly_email():
    data = request.get_json()
    anomaly_count = data.get('anomaly_count')
    details = data.get('details', '')
    if not anomaly_count:
        return {'success': False, 'error': 'Missing anomaly count'}, 400
    subject = 'Bitcoin Anomaly Detection Alert'
    body = f"Anomaly Alert! {anomaly_count} anomalies detected during live analysis.\n\nDetails: {details}"
    send_email(current_user.email, subject, body)
    return {'success': True}

@main_bp.route('/test-pdf')
@login_required
def test_pdf():
    """Test PDF generation"""
    from utils.helpers import test_pdf_generation
    result = test_pdf_generation()
    if result:
        return jsonify({'success': True, 'file': result})
    else:
        return jsonify({'success': False, 'error': 'PDF generation failed'})
