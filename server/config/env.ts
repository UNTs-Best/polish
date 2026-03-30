import { z } from 'zod'                                                                              
                
const envSchema = z.object({                                                                         
    // Server
    PORT: z.string().default('3000'),                                                                  
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),                    

    // Database                                                                                        
    DATABASE_URL: z.string(),

    // Redis
    REDIS_URL: z.string(),
                                                                                                        
    // JWT
    JWT_SECRET: z.string(),                                                                            
    JWT_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_SECRET: z.string(),                                                                    
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
                                                                                                        
    // OAuth      
    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),
    GITHUB_CLIENT_ID: z.string(),                                                                      
    GITHUB_CLIENT_SECRET: z.string(),
    OAUTH_CALLBACK_URL: z.string(),                                                                    
                    
    // S3                                                                                              
    S3_BUCKET: z.string(),
    S3_REGION: z.string(),                                                                             
    S3_ACCESS_KEY: z.string(),
    S3_SECRET_KEY: z.string(),
    S3_ENDPOINT: z.string().optional(),
                                                                                                        
    // AI
    GOOGLE_AI_API_KEY: z.string(),                                                                     
                    
    // Client
    CLIENT_URL: z.string().default('http://localhost:5173'),
})                                                                                                   
