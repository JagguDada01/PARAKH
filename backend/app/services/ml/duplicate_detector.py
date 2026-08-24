import math
import re
from typing import List, Dict, Any, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from app.core.config import settings


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance in kilometers between two points
    on the earth (specified in decimal degrees).
    """
    R = 6371.0  # Earth radius in kilometers

    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2.0) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(d_lon / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(R * c, 3)


def word_jaccard_similarity(text1: str, text2: str) -> float:
    words1 = set(re.findall(r'\b\w+\b', text1.lower()))
    words2 = set(re.findall(r'\b\w+\b', text2.lower()))
    if not words1 or not words2:
        return 0.0
    intersection = words1.intersection(words2)
    union = words1.union(words2)
    return len(intersection) / len(union)


class DuplicateProjectDetector:
    """
    Detects potential duplicate MPLADS projects using a combination of
    NLP semantic text similarity, word token overlap, and geographic proximity.
    """

    def __init__(self, max_distance_km: float = None, similarity_threshold: float = None):
        self.max_distance_km = max_distance_km or settings.DUPLICATE_PROXIMITY_KM
        self.similarity_threshold = similarity_threshold or settings.DUPLICATE_SIMILARITY_THRESHOLD
        self.vectorizer = TfidfVectorizer(
            analyzer="word",
            ngram_range=(1, 2),
            token_pattern=r'(?u)\b\w+\b',
            min_df=1,
            sublinear_tf=True
        )

    def find_potential_duplicates(self, projects: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        if len(projects) < 2:
            return []

        corpus = []
        for p in projects:
            text = f"{p.get('project_type', '')} {p.get('description', '')} {p.get('district', '')} {p.get('constituency', '')}"
            corpus.append(text.lower())

        try:
            tfidf_matrix = self.vectorizer.fit_transform(corpus)
            similarity_matrix = cosine_similarity(tfidf_matrix)
        except Exception:
            similarity_matrix = None

        candidates = []
        # Group projects by state for high-performance spatial-semantic blocking
        from collections import defaultdict
        state_groups = defaultdict(list)
        for idx, p in enumerate(projects):
            st = p.get("state") or "Other"
            state_groups[st].append((idx, p))

        for st, group in state_groups.items():
            if len(group) < 2:
                continue
            
            # Sub-sample or compare within state
            for i_idx, (orig_i, p_a) in enumerate(group):
                lat_a = float(p_a.get("latitude", 0.0) or 0.0)
                lon_a = float(p_a.get("longitude", 0.0) or 0.0)
                desc_a = str(p_a.get("description", ""))

                for orig_j, p_b in group[i_idx + 1: min(len(group), i_idx + 150)]:
                    lat_b = float(p_b.get("latitude", 0.0) or 0.0)
                    lon_b = float(p_b.get("longitude", 0.0) or 0.0)
                    desc_b = str(p_b.get("description", ""))

                    dist_km = haversine_distance_km(lat_a, lon_a, lat_b, lon_b)
                    if dist_km > self.max_distance_km:
                        continue

                    # Semantic similarity from TF-IDF or fallback Jaccard
                    if similarity_matrix is not None:
                        sem_sim = float(similarity_matrix[orig_i, orig_j])
                    else:
                        sem_sim = word_jaccard_similarity(desc_a, desc_b)

                    jaccard_sim = word_jaccard_similarity(desc_a, desc_b)
                    combined_text_sim = max(sem_sim, jaccard_sim)

                    # Type match bonus
                    type_match = p_a.get("project_type") == p_b.get("project_type")
                    if type_match:
                        combined_text_sim = min(1.0, combined_text_sim + 0.1)

                    # Proximity criteria
                    if (dist_km <= self.max_distance_km and combined_text_sim >= self.similarity_threshold) or \
                       (dist_km <= 1.0 and combined_text_sim >= 0.40):
                        
                        proximity_factor = max(0.0, 1.0 - (dist_km / max(0.1, self.max_distance_km)))
                        duplicate_score = round((0.65 * combined_text_sim + 0.35 * proximity_factor) * 100.0, 1)

                        recommendation = (
                            f"Potential duplicate detected: {combined_text_sim * 100:.1f}% similarity at "
                            f"{dist_km:.2f} km distance. Recommendation: Verify whether these represent the same physical asset."
                        )

                        candidates.append({
                            "project_a_id": p_a.get("project_id"),
                            "project_b_id": p_b.get("project_id"),
                            "project_a_title": desc_a[:60],
                            "project_b_title": desc_b[:60],
                            "project_a_state": p_a.get("state"),
                            "project_b_state": p_b.get("state"),
                            "project_a_district": p_a.get("district"),
                            "project_b_district": p_b.get("district"),
                            "semantic_similarity": round(combined_text_sim, 3),
                            "distance_km": dist_km,
                            "duplicate_score": duplicate_score,
                            "status": "FLAGGED",
                            "notes": recommendation
                        })

        candidates.sort(key=lambda x: x["duplicate_score"], reverse=True)
        return candidates[:200]

