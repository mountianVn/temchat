"""SN Parser module for parsing and validating serial number strings."""

from datetime import datetime
from typing import Tuple, Union


def parse_sn(sn_text: str) -> Tuple[bool, Union[dict, str]]:
    """
    Parse and validate a serial number (SN) string.

    Expected format: Mã_NSX,Mã_VL,Số_lượng,Ngày_SX[,Mã_LOT]

    Args:
        sn_text: The serial number string to parse.

    Returns:
        Tuple of (success, result_dict_or_error_message).
        - On success: (True, {"manufacturer": str, "material": str,
                               "quantity": int, "date": str, "lot": str})
        - On failure: (False, error_message_string)
    """
    if not sn_text or not sn_text.strip():
        return (False, "Vui lòng nhập mã SN.")

    sn_text = sn_text.strip()

    fields = [f.strip() for f in sn_text.split(',')]

    if len(fields) < 4:
        return (False, f"Mã SN phải có ít nhất 4 trường (hiện tại: {len(fields)} trường).")

    manufacturer = fields[0]
    if not manufacturer:
        return (False, "Trường 1 (Mã nhà sản xuất) không được để trống.")

    material = fields[1]
    if not material:
        return (False, "Trường 2 (Mã vật liệu) không được để trống.")

    quantity_str = fields[2]
    try:
        quantity = int(quantity_str)
        if quantity < 0:
            return (False, "Trường 3 (Số lượng) phải là số nguyên không âm.")
    except ValueError:
        return (False, "Trường 3 (Số lượng) phải là số nguyên hợp lệ.")

    date_str = fields[3]
    try:
        parsed_date = datetime.strptime(date_str, "%Y-%m-%d")
        formatted_date = parsed_date.strftime("%Y-%m-%d")
    except ValueError:
        return (False, "Trường 4 (Ngày sản xuất) không đúng định dạng YYYY-MM-DD.")

    lot = fields[5] if len(fields) > 5 else "---"

    return (True, {
        "manufacturer": manufacturer,
        "material": material,
        "quantity": quantity,
        "date": formatted_date,
        "lot": lot,
    })
