# MindWave Longitudinal vs Baseline ML Model Evaluation Report

- **Evaluation Date:** `2026-10-27T16:02:32.020077Z`
- **Baseline Model Version:** `1.0.0-rf-mindwave`
- **Algorithm:** `scikit-learn.ensemble.RandomForestClassifier` (Seed: 42)
- **Dataset Citation:** Akram et al. (2023), *Scientific Data* (Nature), DOI: [10.6084/m9.figshare.24052236.v2](https://doi.org/10.6084/m9.figshare.24052236.v2)
- **Clinical Governance Principle:** *Historical assessment features are integrated into the existing ML pipeline only when models have been appropriately evaluated on longitudinal data. Improved accuracy is not claimed without empirical support.*

---

## 1. Schizophrenia / Psychosis Risk (PQ-16) Comparative Evaluation

| Evaluation Metric | Baseline Model (Current Only) | Longitudinal Feature Model | Delta ($\Delta$) |
|:---|:---:|:---:|:---:|
| **Test Accuracy** | **96.77%** | **100.00%** | +0.0323 |
| **ROC-AUC Score** | **0.9978** | **1.0** | +0.0022 |
| **Macro F1 Score** | **0.9618** | **1.0** | +0.0382 |
| **Psychosis Risk Precision** | 91.95% | 100.00% | +0.0805 |
| **Psychosis Risk Recall** | 97.56% | 100.00% | +0.0244 |

### Confusion Matrix Comparison (Held-out Test Set: N=279)
- **Baseline Model:** TN=190, FP=7, FN=2, TP=80
- **Longitudinal Model:** TN=197, FP=0, FN=0, TP=82

---

## 2. Bipolar Disorder Spectrum (MDQ) Comparative Evaluation

| Evaluation Metric | Baseline Model (Current Only) | Longitudinal Feature Model | Delta ($\Delta$) |
|:---|:---:|:---:|:---:|
| **Test Accuracy** | **86.59%** | **86.59%** | +0.0000 |
| **ROC-AUC Score** | **0.9323** | **0.9329** | +0.0006 |
| **Macro F1 Score** | **0.7748** | **0.7671** | -0.0077 |
| **Bipolar Risk Precision** | 47.62% | 47.46% | -0.0016 |
| **Bipolar Risk Recall** | 93.75% | 87.50% | -0.0625 |

### Confusion Matrix Comparison (Held-out Test Set: N=261)
- **Baseline Model:** TN=196, FP=33, FN=2, TP=30
- **Longitudinal Model:** TN=198, FP=31, FN=4, TP=28

---

## 3. Scientific Discussion & Clinical ML Governance

1. **Empirical Findings:**
   - Both the cross-sectional baseline model and the longitudinal feature model demonstrated high discriminative power.
   - For PQ-16, baseline accuracy was **96.77%** (ROC-AUC: **0.9978**) versus longitudinal **100.00%** (ROC-AUC: **1.0**).
   - For MDQ, baseline accuracy was **86.59%** (ROC-AUC: **0.9323**) versus longitudinal **86.59%** (ROC-AUC: **0.9329**).
2. **Clinical and Dataset Constraints:**
   - The primary dataset (*Akram et al. 2023*) is a naturalistic cross-sectional cohort. True longitudinal validation requires multi-wave prospective cohorts.
   - Therefore, the system adheres strictly to the rule: **No claim of improved clinical diagnosis or predictive accuracy is made based on historical features.**
3. **Integrated Clinical Role:**
   - Historical assessments are utilized for **interactive trajectory visualization, domain progression tracking, recommendation effectiveness tracking, and personalized insights**, while the validated baseline model provides the primary calibrated screening risk estimate.
