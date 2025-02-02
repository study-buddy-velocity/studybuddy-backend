import { registerAs } from "@nestjs/config";
import { JwtModuleOptions } from "@nestjs/jwt";

export default registerAs("jwt", (): JwtModuleOptions =>({
  secret: process.env.JWT_PRIVATE_KEY,
  signOptions: {
    expiresIn: process.env.JWT_EXPIRES_IN
  }
})
);