from typing import Any
from pydantic import BaseModel, Field


class OpenApiMetadataSerializer(BaseModel):
    """Schema metadata describing API versions and documentation links."""

    title: str = Field(description="Title of the API specification")
    version: str = Field(description="SemVer API version")
    docs_url: str = Field(description="URL to interactive Swagger UI documentation")
    redoc_url: str = Field(description="URL to ReDoc documentation")
    openapi_url: str = Field(description="URL to raw OpenAPI JSON schema")
    tags: list[str] = Field(description="List of primary categorized route tags")


class ApiEndpointInfoSerializer(BaseModel):
    """Information regarding an API version path and its supported sub-resources."""

    prefix: str = Field(description="URL prefix for the API version")
    status: str = Field(description="Lifecycle status of this API version")
    is_default: bool = Field(description="Whether this prefix is the primary default")
    resources: list[str] = Field(description="Available resource endpoints under this prefix")


class ApiVersionOverviewSerializer(BaseModel):
    """API version overview and discovery payload."""

    service: str = Field(description="Service identification name")
    current_version: str = Field(description="Current primary API version prefix")
    available_versions: list[ApiEndpointInfoSerializer] = Field(
        description="List of active API versions"
    )
    documentation: OpenApiMetadataSerializer = Field(
        description="Links to interactive API documentation"
    )
