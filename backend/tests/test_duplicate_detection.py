import pytest
from app.services.ml.duplicate_detector import DuplicateProjectDetector, haversine_distance_km


def test_haversine_distance():
    # Distance between Mumbai (19.0760, 72.8777) and Pune (18.5204, 73.8567) is ~120 km
    dist = haversine_distance_km(19.0760, 72.8777, 18.5204, 73.8567)
    assert 115.0 < dist < 130.0


def test_duplicate_project_detection():
    detector = DuplicateProjectDetector(max_distance_km=2.0, similarity_threshold=0.60)
    projects = [
        {
            "project_id": "P1",
            "project_type": "Community Halls",
            "description": "Construction of community hall in village rampur",
            "district": "Pune",
            "constituency": "Pune East",
            "latitude": 18.5204,
            "longitude": 73.8567
        },
        {
            "project_id": "P2",
            "project_type": "Community Halls",
            "description": "Erection of community centre social building at village rampur",
            "district": "Pune",
            "constituency": "Pune East",
            "latitude": 18.5240,
            "longitude": 73.8590
        },
        {
            "project_id": "P3",
            "project_type": "Solar Lighting",
            "description": "Installation of 20 solar lights in remote hill ward",
            "district": "Pune",
            "constituency": "Pune West",
            "latitude": 18.9000,
            "longitude": 74.2000
        }
    ]

    duplicates = detector.find_potential_duplicates(projects)
    assert len(duplicates) >= 1
    top_dup = duplicates[0]
    assert top_dup["project_a_id"] in ["P1", "P2"]
    assert top_dup["project_b_id"] in ["P1", "P2"]
    assert top_dup["duplicate_score"] > 60.0
