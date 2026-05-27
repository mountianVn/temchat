# SN Checker - Specification

## 1. Project Overview

- **Project Name**: SN Checker (Kiểm tra mã SN)
- **Type**: Desktop Application
- **Core Functionality**: Parse and validate serial number (SN) codes in CSV format and display extracted fields
- **Target Users**: Quality control staff, warehouse managers, manufacturing personnel

## 2. Technical Stack

- **Language**: Python 3.8+
- **Framework**: PyQt6 (Qt6 for Python)
- **UI Library**: PyQt6.QtWidgets

## 3. UI/UX Specification

### 3.1 Window Configuration
- **Window Title**: "Kiểm tra mã SN"
- **Window Size**: 500x450 pixels (fixed, non-resizable)
- **Window Icon**: None (default)
- **Window Position**: Centered on screen

### 3.2 Color Palette
| Element | Color | Hex Code |
|---------|-------|----------|
| Primary Background | Light Gray | #F5F5F5 |
| Card Background | White | #FFFFFF |
| Primary Text | Dark Gray | #333333 |
| Secondary Text | Medium Gray | #666666 |
| Valid Status | Green | #28A745 |
| Valid Background | Light Green | #D4EDDA |
| Error Status | Red | #DC3545 |
| Error Background | Light Red | #F8D7DA |
| Button Primary | Blue | #007BFF |
| Button Primary Hover | Dark Blue | #0056B3 |
| Button Danger | Red | #DC3545 |
| Button Danger Hover | Dark Red | #C82333 |
| Border | Light Border | #DEE2E6 |

### 3.3 Typography
| Element | Font | Size | Weight |
|---------|------|------|--------|
| Window Title | Segoe UI | 18px | Bold |
| Label Header | Segoe UI | 14px | SemiBold |
| Label Field Name | Segoe UI | 12px | Normal |
| Label Field Value | Segoe UI | 12px | Bold |
| Status Message | Segoe UI | 12px | Normal |
| Button Text | Segoe UI | 12px | Medium |

### 3.4 Layout Structure
```
+------------------------------------------+
|          Kiểm tra mã SN                  |  <- Title (centered)
+------------------------------------------+
|  [Input Card]                            |
|  Nhập mã SN:                             |
|  [________________________]              |  <- QLineEdit
|  [Kiểm tra]  [Xóa]                       |  <- Buttons
+------------------------------------------+
|  [Result Card]                           |
|  Kết quả phân tích:                       |
|                                          |
|  Mã nhà sản xuất:  [VTW0000019]         |
|  Mã vật liệu:      [791-3101-020]       |
|  Số lượng:         [2000]               |
|  Ngày sản xuất:    [2026-01-27]         |
|                                          |
|  [Status: Hợp lệ / Lỗi]                 |  <- Colored status bar
+------------------------------------------+
```

### 3.5 Component Specifications

#### Input Section
- **QLabel**: "Nhập mã SN:"
- **QLineEdit**: 
  - Placeholder: "Nhập mã SN, ví dụ: VTW0000019,791-3101-020,2000,2026-01-27,NA,..."
  - Min width: 400px
  - Text changes trigger validation automatically

#### Buttons
- **Kiểm tra Button**:
  - Text: "Kiểm tra"
  - Style: Primary (blue)
  - Min width: 100px
  - Click triggers validation
  
- **Xóa Button**:
  - Text: "Xóa"
  - Style: Danger (red)
  - Min width: 100px
  - Click clears all fields and results

#### Result Display
- **Result Card**:
  - 4 rows, each with:
    - Field name label (left-aligned)
    - Value label (right-aligned, bold)
  - Initially shows placeholder dashes "---"
  - Border: 1px solid #DEE2E6
  - Border radius: 8px
  - Padding: 15px
  - Background: #FFFFFF

#### Status Bar
- **Status Label**:
  - Empty by default
  - On success: Green background, "✓ Mã SN hợp lệ", text #155724
  - On error: Red background, error message, text #721C24
  - Border radius: 5px
  - Padding: 10px

## 4. Functionality Specification

### 4.1 Core Features

#### SN Parsing Function: `parse_sn(sn_text)`
```python
def parse_sn(sn_text: str) -> tuple[bool, dict | str]
```
- **Input**: SN text string
- **Output**: Tuple of (success, result_data or error_message)
- **Processing Steps**:
  1. Trim whitespace from input
  2. Split by comma delimiter
  3. Validate minimum 4 fields
  4. Parse and validate each field
  5. Return structured data or error message

#### Field Validation Rules
| Field | Index | Validation | Error Message |
|-------|-------|------------|---------------|
| Mã nhà sản xuất | 0 | Non-empty string | "Trường 1 (Mã nhà sản xuất) không được để trống" |
| Mã vật liệu | 1 | Non-empty string | "Trường 2 (Mã vật liệu) không được để trống" |
| Số lượng | 2 | Integer >= 0 | "Trường 3 (Số lượng) phải là số nguyên không âm" |
| Ngày sản xuất | 3 | Format YYYY-MM-DD | "Trường 4 (Ngày sản xuất) không đúng định dạng YYYY-MM-DD" |

### 4.2 User Interactions
1. **On Text Change**: Auto-validate when user types (debounce 300ms)
2. **On "Kiểm tra" Click**: Perform validation and update display
3. **On "Xóa" Click**: Clear input field, results, and status
4. **On Enter Key**: Same as "Kiểm tra" button

### 4.3 Edge Cases
- Empty input: Show nothing (no error)
- Whitespace-only input: Treat as empty
- Extra fields (5+): Ignore extra fields, process first 4
- Negative quantity: Error
- Invalid date format: Error
- Date out of realistic range: Warning (optional)

## 5. File Structure
```
app/
├── SPEC.md           # This specification
├── main.py           # Main application file
└── requirements.txt  # Python dependencies
```

## 6. Acceptance Criteria

### Visual Checkpoints
- [ ] Window displays with title "Kiểm tra mã SN"
- [ ] Input field with placeholder text visible
- [ ] Two buttons visible: "Kiểm tra" and "Xóa"
- [ ] Result card shows 4 rows with field names
- [ ] Green status appears for valid SN
- [ ] Red status appears for invalid SN
- [ ] "Xóa" clears all fields and results

### Functional Checkpoints
- [ ] Valid SN `VTW0000019,791-3101-020,2000,2026-01-27,NA,1260127TAH50070B4641001,NA` shows all 4 fields correctly
- [ ] Empty input shows no error
- [ ] Input with < 4 fields shows error about missing fields
- [ ] Non-integer quantity shows error
- [ ] Invalid date format shows error
- [ ] Auto-validation works on text change

### Code Quality Checkpoints
- [ ] `parse_sn()` function is separate and testable
- [ ] Exception handling is present
- [ ] Code is readable with clear variable names
- [ ] Application runs with `python main.py`
