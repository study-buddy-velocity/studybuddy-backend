import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { json, urlencoded } from 'express';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  app.enableCors({
    origin: configService.get<string>('FRONTEND_URL') || 'http://localhost:3001',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true, 
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      whitelist: true,
    })
  );
  app.useGlobalGuards(new JwtAuthGuard(app.get(JwtService)));
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('StudyBuddy API')
    .setDescription(`
      StudyBuddy is an educational platform that provides AI-powered chat assistance,
      quiz management, and learning analytics for students.

      ## Authentication
      Most endpoints require JWT authentication. Include the JWT token in the Authorization header:
      \`Authorization: Bearer <your-jwt-token>\`

      ## Admin Access
      Some endpoints require admin privileges. Admin users have elevated permissions for managing subjects, quizzes, and user feedback.
    `)
    .setVersion('1.0.0')
    .setContact('StudyBuddy API Support', '', 'support@studybuddy.com')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addServer('http://localhost:3000', 'Development server')
    .addServer('https://api.studybuddy.com', 'Production server')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth', // This name here is important for matching up with @ApiBearerAuth() in your controller!
    )
    .addTag('Authentication', 'User authentication and registration')
    .addTag('Chat', 'AI-powered educational chat features')
    .addTag('Users', 'User management and profile operations')
    .addTag('Feedback', 'User feedback and support system')
    .addTag('Admin - Subjects', 'Subject management (Admin only)')
    .addTag('Admin - Topics', 'Topic management (Admin only)')
    .addTag('Admin - Quizzes', 'Quiz management (Admin only)')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'StudyBuddy API Documentation',
    customfavIcon: '/favicon.ico',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #3b82f6 }
    `,
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
