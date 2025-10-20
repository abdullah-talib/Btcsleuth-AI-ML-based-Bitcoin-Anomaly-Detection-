from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, BooleanField, SubmitField
from wtforms.validators import DataRequired, Email, Length, EqualTo

class LoginForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired()])
    password = PasswordField('Password', validators=[DataRequired()])
    remember_me = BooleanField('Remember Me')
    submit = SubmitField('Sign In')

class RegisterForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired(), Length(min=4, max=20)])
    email = StringField('Email', validators=[DataRequired(), Email()])
    password = PasswordField('Password', validators=[DataRequired(), Length(min=8)])
    password2 = PasswordField('Repeat Password', validators=[DataRequired(), EqualTo('password')])
    submit = SubmitField('Register')

class VerificationForm(FlaskForm):
    code = StringField('Verification Code', validators=[DataRequired(), Length(min=4, max=10)])
    submit = SubmitField('Verify')

class ForgotPasswordForm(FlaskForm):
    email = StringField('Email', validators=[DataRequired(), Email()])
    submit = SubmitField('Send Verification Code')

class ResetPasswordForm(FlaskForm):
    password = PasswordField('New Password', validators=[DataRequired(), Length(min=8)])
    password2 = PasswordField('Repeat New Password', validators=[DataRequired(), EqualTo('password')])
    submit = SubmitField('Reset Password')
 
class UpdateProfileForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired(), Length(min=4, max=20)])
    email = StringField('Email', validators=[DataRequired(), Email()])
    profile_submit = SubmitField('Save Changes')
 
class ChangePasswordForm(FlaskForm):
    current_password = PasswordField('Current Password', validators=[DataRequired()])
    new_password = PasswordField('New Password', validators=[DataRequired(), Length(min=8)])
    new_password2 = PasswordField('Repeat New Password', validators=[DataRequired(), EqualTo('new_password')])
    password_submit = SubmitField('Change Password')
 
class DeleteAccountForm(FlaskForm):
    password = PasswordField('Confirm with Password', validators=[DataRequired()])
    delete_submit = SubmitField('Delete Account')