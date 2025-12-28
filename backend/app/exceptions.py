"""Custom exception classes for the WebEPG API."""

from typing import Any, Dict, Optional

from fastapi import HTTPException, status


class WebEPGException(HTTPException):
    """Base exception class for WebEPG API errors."""

    def __init__(
        self,
        status_code: int,
        detail: str,
        error_code: Optional[str] = None,
        error_type: Optional[str] = None,
    ) -> None:
        super().__init__(status_code=status_code, detail=detail)
        self.error_code = error_code or self.__class__.__name__
        self.error_type = error_type or "WebEPGError"

    def to_dict(self) -> Dict[str, Any]:
        """Convert exception to dictionary for JSON response."""
        return {
            "error": self.detail,
            "error_type": self.error_type,
            "error_code": self.error_code,
            "status_code": self.status_code,
        }


class ChannelNotFoundError(WebEPGException):
    """Raised when channel data is not found."""

    def __init__(self, channel_id: str) -> None:
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Channel data for ID '{channel_id}' not found",
            error_code="CHANNEL_NOT_FOUND",
            error_type="ChannelNotFoundError",
        )
        self.channel_id = channel_id


class SourceNotFoundError(WebEPGException):
    """Raised when source data is not found."""

    def __init__(self, source_id: str) -> None:
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Source '{source_id}' not found",
            error_code="SOURCE_NOT_FOUND",
            error_type="SourceNotFoundError",
        )
        self.source_id = source_id


class ProgrammingNotFoundError(WebEPGException):
    """Raised when programming data is not found."""

    def __init__(self, detail: str) -> None:
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail,
            error_code="PROGRAMMING_NOT_FOUND",
            error_type="ProgrammingNotFoundError",
        )


class InvalidTimezoneError(WebEPGException):
    """Raised when an invalid timezone is provided."""

    def __init__(self, timezone: str) -> None:
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown or invalid timezone: {timezone}",
            error_code="INVALID_TIMEZONE",
            error_type="InvalidTimezoneError",
        )
        self.timezone = timezone


class InvalidDateFormatError(WebEPGException):
    """Raised when date format is invalid."""

    def __init__(self, date: str, expected_format: str = "YYYYMMDD") -> None:
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid date format: {date}. Expected format is {expected_format}",
            error_code="INVALID_DATE_FORMAT",
            error_type="InvalidDateFormatError",
        )
        self.date = date
        self.expected_format = expected_format


class FileProcessingError(WebEPGException):
    """Raised when file processing fails."""

    def __init__(self, filename: str, reason: str) -> None:
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing file '{filename}': {reason}",
            error_code="FILE_PROCESSING_ERROR",
            error_type="FileProcessingError",
        )
        self.filename = filename
        self.reason = reason


class DataProcessingError(WebEPGException):
    """Raised when data processing fails."""

    def __init__(self, operation: str, reason: str) -> None:
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error during {operation}: {reason}",
            error_code="DATA_PROCESSING_ERROR",
            error_type="DataProcessingError",
        )
        self.operation = operation
        self.reason = reason


class TransmitterDataError(WebEPGException):
    """Raised when transmitter data processing fails."""

    def __init__(self, detail: str) -> None:
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=detail,
            error_code="TRANSMITTER_DATA_ERROR",
            error_type="TransmitterDataError",
        )


class ConfigurationError(WebEPGException):
    """Raised when configuration is invalid or missing."""

    def __init__(self, detail: str) -> None:
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Configuration error: {detail}",
            error_code="CONFIGURATION_ERROR",
            error_type="ConfigurationError",
        )


class UnauthorizedError(WebEPGException):
    """Raised when API key authentication fails."""

    def __init__(self, detail: str = "Invalid or missing API key") -> None:
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            error_code="UNAUTHORIZED",
            error_type="UnauthorizedError",
        )

