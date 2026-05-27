"""Registers module for managing data storage in registers D1-D4."""

from PyQt6.QtCore import Qt
from PyQt6.QtWidgets import QFrame, QLabel, QVBoxLayout


class RegisterManager:
    """Manages register storage and display for D1-D6 registers."""

    DEFAULT_REGISTER_NAMES = ["D1", "D2", "D3", "D4", "D5", "D6"]

    DEFAULT_FIELDS = {
        "D1": "Mã nhà sản xuất",
        "D2": "Mã vật liệu",
        "D3": "Số lượng",
        "D4": "Ngày sản xuất",
        "D5": "Mã LOT",
        "D6": "Mã công lệnh",
    }

    def __init__(self):
        self.registers: dict = {}
        self.widgets: dict = {}
        self._current_index: int = 1
        self.reset()

    def reset(self) -> None:
        """Reset all registers to default values."""
        self.registers = {
            name: {"field": self.DEFAULT_FIELDS[name], "value": "---"}
            for name in self.DEFAULT_REGISTER_NAMES
        }
        self._current_index = 1

    def reset_d6(self) -> None:
        """Reset only D6 register to default value."""
        self.registers["D6"]["value"] = "---"

    def update(self, data: dict) -> None:
        """Update D1-D5 registers with parsed SN data."""
        self.registers["D1"]["value"] = data["manufacturer"]
        self.registers["D2"]["value"] = data["material"]
        self.registers["D3"]["value"] = str(data["quantity"])
        self.registers["D4"]["value"] = data["date"]
        self.registers["D5"]["value"] = data.get("lot", "---")

    def update_d6(self, value: str) -> None:
        """Update D6 register with command code."""
        self.registers["D6"]["value"] = value

    def get_next_register(self) -> str:
        """Get the next register name in rotation."""
        names = self.DEFAULT_REGISTER_NAMES
        reg = names[self._current_index - 1]
        self._current_index = (self._current_index % 4) + 1
        return reg

    def register_widget(
        self, name: str, widget: QFrame
    ) -> None:
        """Store reference to register widget for display updates."""
        self.widgets[name] = widget

    def refresh_display(self) -> None:
        """Refresh the display of all register widgets."""
        for reg_name, reg_data in self.registers.items():
            widget = self.widgets.get(reg_name)
            if widget:
                value_label = widget.findChild(QLabel, "register-value")
                if value_label:
                    value_label.setText(reg_data["value"])

    @staticmethod
    def create_register_box(name: str, field: str) -> QFrame:
        """Create a register display box widget."""
        box = QFrame()
        box.setObjectName("register-box")
        box.setFrameShape(QFrame.Shape.StyledPanel)

        layout = QVBoxLayout(box)
        layout.setContentsMargins(8, 6, 8, 6)
        layout.setSpacing(4)
        layout.setAlignment(Qt.AlignmentFlag.AlignCenter)

        title = QLabel(name)
        title.setObjectName("register-title")
        title.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(title)

        field_label = QLabel(field)
        field_label.setObjectName("register-field")
        field_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        field_label.setStyleSheet("color: #6C7086; font-size: 10px;")
        layout.addWidget(field_label)

        value_label = QLabel("---")
        value_label.setObjectName("register-value")
        value_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        value_label.setWordWrap(True)
        layout.addWidget(value_label)

        return box
