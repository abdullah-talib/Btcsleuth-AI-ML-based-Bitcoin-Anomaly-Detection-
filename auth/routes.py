from flask import Blueprint, render_template, request, redirect, url_for, flash, session
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash
from models import User, ActivityLog
from app import db
from utils.helpers import log_activity, send_email
from auth.forms import LoginForm, RegisterForm, VerificationForm
import random
from datetime import datetime, timedelta

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('main.dashboard'))
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()
        if user and user.check_password(form.password.data):
            if not user.is_verified:
                # Generate and send verification code
                code = str(random.randint(100000, 999999))
                user.verification_code = code
                user.verification_expiry = datetime.utcnow() + timedelta(minutes=10)
                db.session.commit()
                send_email(user.email, 'Your Login Verification Code', f'Your verification code is: {code}')
                session['pending_user_id'] = user.id
                log_activity(user.id, 'Login Verification Code Sent', 'Verification code sent for login.')
                flash('Your account is not verified. A verification code has been sent to your email.', 'info')
                return redirect(url_for('auth.verify'))
            login_user(user, remember=form.remember_me.data)
            log_activity(user.id, 'User Login', f'User {user.username} logged in successfully')
            flash('Login successful!', 'success')
            next_page = request.args.get('next')
            return redirect(next_page) if next_page else redirect(url_for('main.dashboard'))
        else:
            if user:
                log_activity(user.id, 'Failed Login Attempt', 'Invalid password')
            flash('Invalid username or password', 'error')
    return render_template('auth/login.html', form=form)

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('main.dashboard'))
    form = RegisterForm()
    if form.validate_on_submit():
        if User.query.filter_by(username=form.username.data).first():
            flash('Username already exists', 'error')
        elif User.query.filter_by(email=form.email.data).first():
            flash('Email already registered', 'error')
        else:
            user = User(
                username=form.username.data,
                email=form.email.data
            )
            user.set_password(form.password.data)
            # Generate verification code
            code = str(random.randint(100000, 999999))
            user.verification_code = code
            user.verification_expiry = datetime.utcnow() + timedelta(minutes=10)
            user.is_verified = False
            db.session.add(user)
            db.session.commit()
            log_activity(user.id, 'User Registration', f'New user {user.username} registered')
            # Send verification email
            send_email(user.email, 'Your Verification Code', f'Your verification code is: {code}')
            session['pending_user_id'] = user.id
            flash('Registration successful! Please check your email for the verification code.', 'info')
            return redirect(url_for('auth.verify'))
    return render_template('auth/register.html', form=form)

@auth_bp.route('/verify', methods=['GET', 'POST'])
def verify():
    user_id = session.get('pending_user_id')
    if not user_id:
        flash('No verification pending.', 'error')
        return redirect(url_for('auth.login'))
    user = User.query.get(user_id)
    if not user:
        flash('User not found.', 'error')
        return redirect(url_for('auth.login'))
    form = VerificationForm()
    if form.validate_on_submit():
        if user.verification_code == form.code.data and user.verification_expiry > datetime.utcnow():
            user.is_verified = True
            user.verification_code = None
            user.verification_expiry = None
            db.session.commit()
            log_activity(user.id, 'User Verified', 'User verified their email.')
            flash('Email verified! You can now log in.', 'success')
            session.pop('pending_user_id', None)
            return redirect(url_for('auth.login'))
        else:
            flash('Invalid or expired verification code.', 'error')
    return render_template('auth/verify.html', form=form)

@auth_bp.route('/logout')
@login_required
def logout():
    log_activity(current_user.id, 'User Logout', f'User {current_user.username} logged out')
    logout_user()
    flash('You have been logged out.', 'info')
    return redirect(url_for('main.index'))

@auth_bp.route('/forgot_password', methods=['GET', 'POST'])
def forgot_password():
    from auth.forms import ForgotPasswordForm
    form = ForgotPasswordForm()
    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data).first()
        if user:
            # Generate reset code
            import random
            from datetime import datetime, timedelta
            code = str(random.randint(100000, 999999))
            user.verification_code = code
            user.verification_expiry = datetime.utcnow() + timedelta(minutes=10)
            db.session.commit()
            send_email(user.email, 'Password Reset Code', f'Your password reset code is: {code}')
            session['reset_user_id'] = user.id
            flash('A password reset code has been sent to your email.', 'info')
            return redirect(url_for('auth.reset_password'))
        else:
            flash('No account found with that email.', 'error')
    return render_template('auth/forgot_password.html', form=form)

@auth_bp.route('/reset_password', methods=['GET', 'POST'])
def reset_password():
    from auth.forms import ResetPasswordForm, VerificationForm
    user_id = session.get('reset_user_id')
    if not user_id:
        flash('No password reset requested.', 'error')
        return redirect(url_for('auth.forgot_password'))
    user = User.query.get(user_id)
    if not user:
        flash('User not found.', 'error')
        return redirect(url_for('auth.forgot_password'))
    code_form = VerificationForm()
    pass_form = ResetPasswordForm()
    if code_form.validate_on_submit() and 'code' in request.form:
        if user.verification_code == code_form.code.data and user.verification_expiry > datetime.utcnow():
            session['reset_verified'] = True
            flash('Code verified. Please enter your new password.', 'success')
        else:
            flash('Invalid or expired code.', 'error')
    elif pass_form.validate_on_submit() and session.get('reset_verified'):
        user.set_password(pass_form.password.data)
        user.verification_code = None
        user.verification_expiry = None
        db.session.commit()
        session.pop('reset_user_id', None)
        session.pop('reset_verified', None)
        flash('Your password has been reset. You can now log in.', 'success')
        return redirect(url_for('auth.login'))
    return render_template('auth/reset_password.html', code_form=code_form, pass_form=pass_form, user_verified=session.get('reset_verified', False))
