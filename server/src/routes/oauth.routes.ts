import { Router } from 'express'
import * as oauthController from '../controllers/oauth.controller'

const router = Router()

router.get('/providers', oauthController.getProviders)
router.get('/:provider/url', oauthController.getAuthUrl)
router.get('/:provider/callback', oauthController.handleCallback)
router.post('/:provider/callback', oauthController.handleCallback)
router.get('/:provider', oauthController.initiateFlow)

export default router
