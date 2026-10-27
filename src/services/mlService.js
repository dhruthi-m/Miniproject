/**
 * MindWave Random Forest Machine Learning Client Service
 * Communicates with the FastAPI prediction microservice on port 8000.
 */

const ML_API_BASE = 'http://localhost:8000';

/**
 * Request ML analysis for a completed screening questionnaire
 * @param {Object} params
 * @param {string} params.assessmentType - 'schizophrenia' or 'bipolar'
 * @param {string} params.ageGroup - e.g. '19-25', '6-12'
 * @param {string} params.profession - profession identifier
 * @param {Array} params.answers - Array of question answer objects
 * @returns {Promise<Object>} ML prediction result object
 */
export async function fetchMlPrediction({ assessmentType, ageGroup, profession, answers, history }) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const response = await fetch(`${ML_API_BASE}/api/ml/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      signal: controller.signal,
      body: JSON.stringify({
        assessment_type: assessmentType,
        age_group: ageGroup,
        profession,
        answers: answers || [],
        history: history || []
      })
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      return await response.json();
    }

    const errData = await response.json().catch(() => ({}));
    return {
      status: 'error',
      is_supported: false,
      unsupported_reason: errData.detail || 'Screening assessment service returned an unexpected error response.',
      assessment_type: assessmentType,
      algorithm: 'RandomForestClassifier'
    };
  } catch (err) {
    return {
      status: 'offline',
      is_supported: false,
      unsupported_reason: 'Screening assessment is currently unavailable (service is not reachable).',
      assessment_type: assessmentType,
      algorithm: 'RandomForestClassifier'
    };
  }
}

/**
 * Check health status of the ML prediction service
 * @returns {Promise<Object>}
 */
export async function checkMlHealth() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${ML_API_BASE}/api/ml/health`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      return await res.json();
    }
    return { status: 'unhealthy' };
  } catch {
    return { status: 'offline' };
  }
}
