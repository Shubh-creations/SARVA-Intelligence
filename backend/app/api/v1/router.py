from fastapi import APIRouter

from app.api.v1.advanced_fintech import router as advanced_fintech_router
from app.api.v1.ap_agent import router as ap_agent_router
from app.api.v1.ar_agent import router as ar_agent_router
from app.api.v1.cfo_copilot import router as cfo_copilot_router
from app.api.v1.compliance import router as compliance_router
from app.api.v1.connectors import router as connectors_router
from app.api.v1.forecasting import router as forecasting_router
from app.api.v1.health import router as health_router
from app.api.v1.identity import router as identity_router
from app.api.v1.knowledge_graph import router as knowledge_graph_router
from app.api.v1.monitoring import router as monitoring_router
from app.api.v1.procurement import router as procurement_router
from app.api.v1.recommendations import router as recommendations_router
from app.api.v1.reconciliation import router as reconciliation_router
from app.api.v1.treasury import router as treasury_router

from app.api.v1.feedback import router as feedback_router
from app.api.v1.sample_data import router as sample_data_router
from app.api.v1.settings import router as settings_router
from app.api.v1.tier1_ops import router as tier1_ops_router

router = APIRouter()
router.include_router(health_router)
router.include_router(identity_router)
router.include_router(connectors_router)
router.include_router(forecasting_router)
router.include_router(monitoring_router)
router.include_router(ap_agent_router)
router.include_router(ar_agent_router)
router.include_router(treasury_router)
router.include_router(reconciliation_router)
router.include_router(procurement_router)
router.include_router(knowledge_graph_router)
router.include_router(cfo_copilot_router)
router.include_router(recommendations_router)
router.include_router(compliance_router)
router.include_router(advanced_fintech_router)
router.include_router(tier1_ops_router)
router.include_router(sample_data_router)
router.include_router(feedback_router)
router.include_router(settings_router)




