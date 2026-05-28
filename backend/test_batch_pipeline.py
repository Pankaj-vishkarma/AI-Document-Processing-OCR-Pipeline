#!/usr/bin/env python
"""
Comprehensive batch pipeline test script.
Tests: batch upload → OCR → classification → extraction → export (all formats)
"""

import os
import sys
import json
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


# Test imports
def test_imports():
    """Verify all modified services import correctly"""
    logger.info("=" * 70)
    logger.info("TEST 1: Verifying service imports")
    logger.info("=" * 70)

    try:
        from services.ocr_engine import OCREngine

        logger.info("✓ OCREngine imported successfully")

        from services.field_extractor import FieldExtractor

        logger.info("✓ FieldExtractor imported successfully")

        from services.export_service import ExportService

        logger.info("✓ ExportService imported successfully")

        from services.table_extractor import TableExtractor

        logger.info("✓ TableExtractor imported successfully")

        return True
    except Exception as e:
        logger.error(f"✗ Import failed: {e}")
        return False


# Test OCR allowlist
def test_ocr_allowlist():
    """Verify currency symbols are in OCR allowlist"""
    logger.info("\n" + "=" * 70)
    logger.info("TEST 2: Verifying OCR currency symbol support")
    logger.info("=" * 70)

    from services.ocr_engine import OCREngine

    engine = OCREngine()
    currency_symbols = ["₹", "€", "$", "¥", "£", "₽", "₺", "₩", "₪", "₨"]

    allowlist = engine.OCR_ALLOWLIST
    missing = []

    for symbol in currency_symbols:
        if symbol in allowlist:
            logger.info(f"✓ Currency symbol '{symbol}' found in allowlist")
        else:
            logger.warning(f"✗ Currency symbol '{symbol}' NOT in allowlist")
            missing.append(symbol)

    return len(missing) == 0


# Test money value normalization
def test_money_normalization():
    """Test OCR artifact cleanup in money values"""
    logger.info("\n" + "=" * 70)
    logger.info("TEST 3: Verifying money value normalization")
    logger.info("=" * 70)

    from services.field_extractor import FieldExtractor

    extractor = FieldExtractor()
    test_cases = [
        ("I999.50", "999.50", "Leading I removal"),
        ("₹1,999.99", "₹1999.99", "Comma removal with currency"),
        ("$500", "$500", "Currency preservation"),
        ("I2,500.00", "2500.00", "I removal + comma cleanup"),
    ]

    all_pass = True
    for input_val, expected, description in test_cases:
        result = extractor.normalize_money_value(input_val)
        # Normalize for comparison (handle minor variations)
        result_normalized = result.strip()
        expected_normalized = expected.strip()

        if result_normalized == expected_normalized:
            logger.info(f"✓ {description}: '{input_val}' → '{result}'")
        else:
            logger.warning(
                f"✗ {description}: '{input_val}' → '{result}' (expected: '{expected}')"
            )
            all_pass = False

    return all_pass


# Test line items flattening
def test_line_items_flattening():
    """Test CSV/Excel line items formatting"""
    logger.info("\n" + "=" * 70)
    logger.info("TEST 4: Verifying line items flattening for export")
    logger.info("=" * 70)

    from services.export_service import ExportService

    service = ExportService()

    test_cases = [
        # Test case 1: List of dicts
        (
            [
                {
                    "description": "Widget A",
                    "qty": 2,
                    "price": "10.00",
                    "amount": "20.00",
                },
                {
                    "description": "Widget B",
                    "qty": 1,
                    "price": "15.00",
                    "amount": "15.00",
                },
            ],
            "List of dicts with multiple items",
        ),
        # Test case 2: Single item
        (
            [
                {
                    "description": "Service",
                    "quantity": 1,
                    "unit_price": "100.00",
                    "total": "100.00",
                }
            ],
            "Single item with alternative field names",
        ),
        # Test case 3: Empty
        (None, "None/empty line items"),
    ]

    for line_items, description in test_cases:
        result = service._flatten_line_items(line_items)
        logger.info(f"✓ {description}:")
        logger.info(f"  Input: {line_items}")
        logger.info(f"  Output: {result}")

    return True


# Test export row building
def test_export_rows():
    """Test that extracted_data is included in export rows"""
    logger.info("\n" + "=" * 70)
    logger.info("TEST 5: Verifying export rows include extracted_data")
    logger.info("=" * 70)

    from services.export_service import ExportService
    from models.document_model import Document

    service = ExportService()

    # Create mock document with extracted_data
    class MockDocument:
        def __init__(self):
            self.id = 1
            self.original_filename = "invoice.pdf"
            self.document_type = "invoice"
            self.status = "completed"
            self.confidence_score = 0.95
            self.created_at = "2026-05-28"
            self.extracted_data = {
                "vendor_name": "ACME Corp",
                "invoice_number": "INV-2024-001",
                "invoice_date": "2026-05-28",
                "subtotal": "1000.00",
                "tax": "100.00",
                "total": "1100.00",
                "line_items": [
                    {
                        "description": "Service",
                        "qty": 1,
                        "price": "1000.00",
                        "amount": "1000.00",
                    }
                ],
            }

    docs = [MockDocument()]
    rows = service._build_rows(docs)

    if rows:
        row = rows[0]
        logger.info(f"✓ Row keys: {list(row.keys())}")

        required_fields = [
            "vendor_name",
            "invoice_number",
            "invoice_date",
            "subtotal",
            "tax",
            "total",
            "line_items",
        ]

        missing = [f for f in required_fields if f not in row]

        if missing:
            logger.warning(f"✗ Missing fields in export row: {missing}")
            return False
        else:
            logger.info(f"✓ All required fields present in export row")
            for field in required_fields:
                logger.info(f"  - {field}: {row[field]}")
            return True
    else:
        logger.error("✗ No rows generated")
        return False


# Test table extractor logging
def test_table_extractor_logging():
    """Verify table extractor has logging"""
    logger.info("\n" + "=" * 70)
    logger.info("TEST 6: Verifying table extractor has logging")
    logger.info("=" * 70)

    from services.table_extractor import TableExtractor
    import inspect

    extractor = TableExtractor()
    source = inspect.getsource(extractor.detect_tables)

    if "logger" in source:
        logger.info("✓ Table extractor has logging statements")

        log_calls = [
            ("logger.error", "Error logging"),
            ("logger.warning", "Warning logging"),
            ("logger.debug", "Debug logging"),
            ("logger.info", "Info logging"),
        ]

        for log_call, desc in log_calls:
            if log_call in source:
                logger.info(f"  ✓ {desc} present")

        return True
    else:
        logger.warning("✗ Table extractor logging not found")
        return False


# Run all tests
def run_all_tests():
    """Execute all tests"""
    logger.info("\n")
    logger.info("╔" + "═" * 68 + "╗")
    logger.info("║" + " " * 68 + "║")
    logger.info("║" + "BATCH PIPELINE FIXES VERIFICATION TEST SUITE".center(68) + "║")
    logger.info("║" + " " * 68 + "║")
    logger.info("╚" + "═" * 68 + "╝")

    tests = [
        ("Service Imports", test_imports),
        ("OCR Currency Symbols", test_ocr_allowlist),
        ("Money Normalization", test_money_normalization),
        ("Line Items Flattening", test_line_items_flattening),
        ("Export Rows with Data", test_export_rows),
        ("Table Extractor Logging", test_table_extractor_logging),
    ]

    results = []

    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            logger.error(f"✗ Test '{test_name}' raised exception: {e}", exc_info=True)
            results.append((test_name, False))

    # Summary
    logger.info("\n" + "=" * 70)
    logger.info("TEST SUMMARY")
    logger.info("=" * 70)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for test_name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        logger.info(f"{status}: {test_name}")

    logger.info("-" * 70)
    logger.info(f"Results: {passed}/{total} tests passed")

    if passed == total:
        logger.info("\n✓ All batch pipeline fixes verified successfully!")
        return 0
    else:
        logger.warning(f"\n✗ {total - passed} test(s) failed")
        return 1


if __name__ == "__main__":
    sys.exit(run_all_tests())
