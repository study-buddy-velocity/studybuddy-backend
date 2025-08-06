import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Model } from 'mongoose';
import { User } from '../schemas/user.schema';
import { getModelToken } from '@nestjs/mongoose';
import { encryptData } from '../utils/encrypt_decrypt';

async function createAdminUser() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userModel = app.get<Model<User>>(getModelToken(User.name));

  const adminEmail = 'admin@studybuddy.com';
  const adminPassword = 'admin123';

  try {
    // Check if admin already exists
    const existingAdmin = await userModel.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      // //console.log('Admin user already exists');
      
      // Update role to admin if it's not already
      if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin';
        await existingAdmin.save();
        // //console.log('Updated existing user role to admin');
      }
      
      // //console.log('Admin details:');
      // //console.log('Email:', adminEmail);
      // //console.log('Password:', adminPassword);
      // //console.log('Role:', existingAdmin.role);
    } else {
      // Create new admin user
      const encryptedPassword = encryptData(adminPassword);
      
      const adminUser = new userModel({
        email: adminEmail,
        password: encryptedPassword,
        role: 'admin'
      });

      await adminUser.save();
      // //console.log('Admin user created successfully!');
      // //console.log('Email:', adminEmail);
      // //console.log('Password:', adminPassword);
      // //console.log('Role: admin');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await app.close();
  }
}

// Run the script
createAdminUser();
