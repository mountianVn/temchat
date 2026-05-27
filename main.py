"""
SN Checker Application - Kiểm tra mã SN
Desktop application for parsing and validating serial number codes using PyQt6.
"""

import sys

from PyQt6.QtCore import Qt, QTimer
from PyQt6.QtWidgets import (
    QApplication,
    QWidget,
    QVBoxLayout,
    QHBoxLayout,
    QLabel,
    QLineEdit,
    QPushButton,
    QFrame,
)

from styles import STYLESHEET
from parser import parse_sn
from registers import RegisterManager


# =============================================================================
# Main Window
# =============================================================================

class SNCheckerWindow(QWidget):
    """Main application window for the SN Checker."""

    def __init__(self):
        super().__init__()
        self.setWindowTitle("Kiểm tra mã SN")
        self.setFixedSize(1024, 768)
        self.setStyleSheet(STYLESHEET)

        self._registers = RegisterManager()
        self._init_ui()
        self._connect_signals()

    # -------------------------------------------------------------------------
    # UI Setup
    # -------------------------------------------------------------------------

    def _init_ui(self):
        main_layout = QVBoxLayout(self)
        main_layout.setContentsMargins(20, 20, 20, 20)
        main_layout.setSpacing(16)

        self._create_title(main_layout)
        self._create_input_card(main_layout)
        self._create_command_code_card(main_layout)
        self._create_result_card(main_layout)
        self._create_registers_card(main_layout)
        self._create_status_label(main_layout)

    def _create_title(self, parent_layout: QVBoxLayout):
        title = QLabel("Kiểm tra mã SN")
        title.setObjectName("title")
        title.setAlignment(Qt.AlignmentFlag.AlignCenter)
        parent_layout.addWidget(title)

    def _create_input_card(self, parent_layout: QVBoxLayout):
        card = QFrame()
        card.setObjectName("card")
        card.setFrameShape(QFrame.Shape.StyledPanel)

        layout = QVBoxLayout(card)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(10)

        section_title = QLabel("Nhập mã SN")
        section_title.setObjectName("section-title")
        layout.addWidget(section_title)

        self.input_field = QLineEdit()
        self.input_field.setPlaceholderText(
            "Ví dụ: VTW0000019,791-3101-020,2000,2026-01-27,NA,..."
        )
        layout.addWidget(self.input_field)

        button_layout = QHBoxLayout()
        button_layout.setSpacing(10)

        self.btn_check = QPushButton("Kiểm tra")
        self.btn_check.setObjectName("btn-check")
        button_layout.addWidget(self.btn_check)

        self.btn_clear = QPushButton("Xóa")
        self.btn_clear.setObjectName("btn-clear")
        button_layout.addWidget(self.btn_clear)

        button_layout.addStretch()
        layout.addLayout(button_layout)

        parent_layout.addWidget(card)

    def _create_command_code_card(self, parent_layout: QVBoxLayout):
        card = QFrame()
        card.setObjectName("card")
        card.setFrameShape(QFrame.Shape.StyledPanel)

        layout = QVBoxLayout(card)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(10)

        section_title = QLabel("Mã công lệnh")
        section_title.setObjectName("section-title")
        layout.addWidget(section_title)

        input_row = QHBoxLayout()
        input_row.setSpacing(10)

        self.command_field = QLineEdit()
        self.command_field.setPlaceholderText("Nhập mã công lệnh...")
        input_row.addWidget(self.command_field)

        self.btn_save_command = QPushButton("Lưu vào D6")
        self.btn_save_command.setObjectName("btn-check")
        self.btn_save_command.setMinimumWidth(100)
        input_row.addWidget(self.btn_save_command)

        layout.addLayout(input_row)

        parent_layout.addWidget(card)

    def _create_result_card(self, parent_layout: QVBoxLayout):
        card = QFrame()
        card.setObjectName("card")
        card.setFrameShape(QFrame.Shape.StyledPanel)

        layout = QVBoxLayout(card)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(10)

        section_title = QLabel("Kết quả phân tích")
        section_title.setObjectName("section-title")
        layout.addWidget(section_title)

        self.result_rows = {}

        self.result_rows["manufacturer"] = self._create_result_row(
            card, "Mã nhà sản xuất:", "---"
        )
        self.result_rows["material"] = self._create_result_row(
            card, "Mã vật liệu:", "---"
        )
        self.result_rows["quantity"] = self._create_result_row(
            card, "Số lượng:", "---"
        )
        self.result_rows["date"] = self._create_result_row(
            card, "Ngày sản xuất:", "---"
        )
        self.result_rows["lot"] = self._create_result_row(
            card, "Mã LOT:", "---"
        )

        parent_layout.addWidget(card)

    def _create_result_row(
        self, parent: QFrame, label_text: str, default_value: str
    ) -> dict:
        """Create a single result row with label and value."""
        row_layout = QHBoxLayout()
        row_layout.setSpacing(10)

        label = QLabel(label_text)
        label.setObjectName("result-label")
        label.setMinimumWidth(140)
        row_layout.addWidget(label)

        value_label = QLabel(default_value)
        value_label.setObjectName("result-value")
        value_label.setAlignment(Qt.AlignmentFlag.AlignRight | Qt.AlignmentFlag.AlignVCenter)
        row_layout.addWidget(value_label)

        parent.layout().addLayout(row_layout)
        return {"label": label, "value": value_label}

    def _create_registers_card(self, parent_layout: QVBoxLayout):
        card = QFrame()
        card.setObjectName("registers-card")
        card.setFrameShape(QFrame.Shape.StyledPanel)

        layout = QVBoxLayout(card)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(10)

        section_title = QLabel("Thanh ghi lưu kết quả")
        section_title.setObjectName("section-title")
        layout.addWidget(section_title)

        registers_row = QHBoxLayout()
        registers_row.setSpacing(10)

        for reg_name in ["D1", "D2", "D3", "D4"]:
            reg_box = RegisterManager.create_register_box(
                reg_name, RegisterManager.DEFAULT_FIELDS[reg_name]
            )
            self._registers.register_widget(reg_name, reg_box)
            registers_row.addWidget(reg_box)

        registers_row.addStretch()
        layout.addLayout(registers_row)

        d5_row = QHBoxLayout()
        d5_row.setSpacing(10)

        for reg_name in ["D5", "D6"]:
            reg_box = RegisterManager.create_register_box(
                reg_name, RegisterManager.DEFAULT_FIELDS[reg_name]
            )
            self._registers.register_widget(reg_name, reg_box)
            d5_row.addWidget(reg_box)

        d5_row.addStretch()
        layout.addLayout(d5_row)

        parent_layout.addWidget(card)

    def _create_status_label(self, parent_layout: QVBoxLayout):
        self.status_label = QLabel("")
        self.status_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.status_label.setWordWrap(True)
        self.status_label.setVisible(False)
        parent_layout.addWidget(self.status_label)

    # -------------------------------------------------------------------------
    # Signal/Slot Connections
    # -------------------------------------------------------------------------

    def _connect_signals(self):
        self.btn_check.clicked.connect(self._on_check_clicked)
        self.btn_clear.clicked.connect(self._on_clear_clicked)
        self.btn_save_command.clicked.connect(self._on_save_command_clicked)
        self.input_field.returnPressed.connect(self._on_check_clicked)
        self.command_field.returnPressed.connect(self._on_save_command_clicked)

        self.input_field.textChanged.connect(self._on_text_changed)
        self._debounce_timer = QTimer(self)
        self._debounce_timer.setSingleShot(True)
        self._debounce_timer.timeout.connect(self._do_auto_validate)

    # -------------------------------------------------------------------------
    # Event Handlers
    # -------------------------------------------------------------------------

    def _on_check_clicked(self):
        self._validate_input()

    def _on_clear_clicked(self):
        self.input_field.clear()
        self.command_field.clear()
        self._reset_results()
        self._registers.reset()
        self._registers.refresh_display()
        self._hide_status()

    def _on_save_command_clicked(self):
        command_code = self.command_field.text().strip()
        if not command_code:
            self._show_status_error("Vui lòng nhập mã công lệnh.")
            return
        self._registers.update_d6(command_code)
        self._registers.refresh_display()
        self._show_status_success(f"Đã lưu '{command_code}' vào D6.")
        self.command_field.clear()

    def _on_text_changed(self, text: str):
        self._debounce_timer.start(300)

    def _do_auto_validate(self):
        text = self.input_field.text().strip()
        if text:
            self._validate_input()

    # -------------------------------------------------------------------------
    # Validation Logic
    # -------------------------------------------------------------------------

    def _validate_input(self):
        sn_text = self.input_field.text()
        success, result = parse_sn(sn_text)

        if success:
            saved_d6 = self._registers.registers["D6"]["value"]
            self._registers.reset()
            self._registers.refresh_display()
            self._display_result(result)
            self._registers.update(result)
            self._registers.update_d6(saved_d6)
            self._registers.refresh_display()
            self._show_status_success("Mã SN hợp lệ!")
            self.input_field.clear()
        else:
            self._show_status_error(result)

    def _display_result(self, data: dict):
        self.result_rows["manufacturer"]["value"].setText(data["manufacturer"])
        self.result_rows["material"]["value"].setText(data["material"])
        self.result_rows["quantity"]["value"].setText(str(data["quantity"]))
        self.result_rows["date"]["value"].setText(data["date"])
        self.result_rows["lot"]["value"].setText(data.get("lot", "---"))

    def _reset_results(self):
        placeholder = "---"
        self.result_rows["manufacturer"]["value"].setText(placeholder)
        self.result_rows["material"]["value"].setText(placeholder)
        self.result_rows["quantity"]["value"].setText(placeholder)
        self.result_rows["date"]["value"].setText(placeholder)
        self.result_rows["lot"]["value"].setText(placeholder)

    def _show_status_success(self, message: str):
        self.status_label.setText(f"  {message}  ")
        self.status_label.setProperty("class", "status-success")
        self.status_label.setStyleSheet(STYLESHEET)
        self.status_label.setVisible(True)

    def _show_status_error(self, message: str):
        self.status_label.setText(f"  {message}  ")
        self.status_label.setProperty("class", "status-error")
        self.status_label.setStyleSheet(STYLESHEET)
        self.status_label.setVisible(True)

    def _hide_status(self):
        self.status_label.setVisible(False)


# =============================================================================
# Application Entry Point
# =============================================================================

def main():
    """Initialize and run the SN Checker application."""
    app = QApplication(sys.argv)
    app.setApplicationName("SN Checker")

    window = SNCheckerWindow()
    window.show()

    sys.exit(app.exec())


if __name__ == "__main__":
    main()
