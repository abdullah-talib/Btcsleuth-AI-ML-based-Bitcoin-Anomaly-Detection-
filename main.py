# This file is renamed to avoid conflict with the main package directory
# The actual application entry point is now in application.py
from application import app

# For backward compatibility
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
