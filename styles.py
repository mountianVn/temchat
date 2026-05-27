"""Stylesheet for SN Checker application - Dark Theme."""

STYLESHEET = """
QWidget {
    background-color: #FFFFFF;
    font-family: 'Segoe UI', Arial, sans-serif;
}

QLabel#title {
    color: #333333;
    font-size: 22px;
    font-weight: bold;
}

QLabel#section-title {
    color: #333333;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 8px;
}

.card {
    background-color: #FFFFFF;
    border: 1px solid #DEE2E6;
    border-radius: 8px;
    padding: 15px;
}

QLineEdit {
    border: 1px solid #CED4DA;
    border-radius: 5px;
    padding: 10px 12px;
    font-size: 13px;
    background-color: #FFFFFF;
    color: #333333;
}

QLineEdit:focus {
    border: 2px solid #007BFF;
    outline: none;
}

QLineEdit::placeholder {
    color: #999999;
}

QPushButton#btn-check {
    background-color: #007BFF;
    color: #FFFFFF;
    border: none;
    border-radius: 5px;
    padding: 10px 20px;
    font-size: 13px;
    font-weight: 600;
    min-width: 100px;
}

QPushButton#btn-check:hover {
    background-color: #0056B3;
}

QPushButton#btn-check:pressed {
    background-color: #004085;
}

QPushButton#btn-clear {
    background-color: #DC3545;
    color: #FFFFFF;
    border: none;
    border-radius: 5px;
    padding: 10px 20px;
    font-size: 13px;
    font-weight: 600;
    min-width: 100px;
}

QPushButton#btn-clear:hover {
    background-color: #C82333;
}

QPushButton#btn-clear:pressed {
    background-color: #A71D2A;
}

.result-label {
    color: #666666;
    font-size: 13px;
}

.result-value {
    color: #333333;
    font-size: 13px;
    font-weight: bold;
}

.status-success {
    background-color: #D4EDDA;
    color: #155724;
    border: 1px solid #C3E6CB;
    border-radius: 5px;
    padding: 12px;
    font-size: 13px;
    font-weight: 500;
}

.status-error {
    background-color: #F8D7DA;
    color: #721C24;
    border: 1px solid #F5C6CB;
    border-radius: 5px;
    padding: 12px;
    font-size: 13px;
    font-weight: 500;
}

.separator {
    background-color: #DEE2E6;
    max-height: 1px;
}

QLabel#register-label {
    color: #007BFF;
    font-size: 13px;
    font-weight: bold;
}

.registers-card {
    background-color: #FFFFFF;
    border: 1px solid #DEE2E6;
    border-radius: 8px;
    padding: 15px;
}

.register-box {
    background-color: #F8F9FA;
    border: 1px solid #DEE2E6;
    border-radius: 5px;
    padding: 8px 12px;
    min-width: 180px;
}

.register-title {
    color: #007BFF;
    font-size: 12px;
    font-weight: bold;
}

.register-field {
    color: #6C757D;
    font-size: 10px;
}

.register-value {
    color: #333333;
    font-size: 14px;
    font-weight: bold;
}
"""
