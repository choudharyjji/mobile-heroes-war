import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import axios from 'axios';
import * as bcrypt from 'bcrypt';

import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { User } from 'src/users/schemas/user.schema';
import { UsersService } from 'src/users/users.service';
import { CustomIdAuthDto } from './dto/custom-id-auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
  ) {}
  async otherValidateUser(userId: string) {
    return await this.userService.findUserByIdOrName(userId);
  }
  async validateUser(username: string, password: string): Promise<User> {
    const user: User = await this.userService.findUser(username);

    if (!user) {
      throw new UnauthorizedException('user not exists!');
    }

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException('wrong password!');
    }
    return user;
  }
  async signIn(user: User): Promise<any> {
    const payload = {
      id: user._id,
      username: user.username,
      ingameName: user.name,
      gold: user.gold,
      rankpoint: user.rankpoints,
      role: 'client',
    };

    console.log('Payload is =====>', payload);
    const access_token = this.jwtService.sign(payload, {
      secret: process.env.SECRET_KEY,
    });
    return {
      access_token,
      payload,
    };
  }
  async serverSignIn(id: string): Promise<any> {
    const payload = { id, role: 'server' };
    const access_token = this.jwtService.sign(payload, {
      secret: process.env.SECRET_KEY,
    });
    console.log('server signin with id: ' + { id });
    return {
      access_token,
      payload,
    };
  }
  async signUp(createUserDto: CreateUserDto): Promise<any> {
    try {
      const user = await this.userService.findUser(createUserDto.username);
      if (user) {
        throw new BadRequestException('User already exists!');
      }

      const userWithName = await this.userService.findName(createUserDto.name);
      if (userWithName) {
        throw new BadRequestException(
          'Name has been chosen, please use another name!',
        );
      }

      const createUser = await this.userService.createUser(createUserDto);
      return this.signIn(createUser);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new BadRequestException('An error occurred during sign up');
    }
  }
  async exchangeToken(): Promise<string> {
    const projectId = process.env.Project_ID;
    const environmentId = process.env.ENV_UNITY_ID;
    const serviceAccountKeyId = process.env.KEY_ID_UNITY;
    const secretKey = process.env.SECRET_KEY_UNITY;
    const url = `https://services.api.unity.com/auth/v1/token-exchange?projectId=${projectId}&environmentId=${environmentId}`;

    try {
      const response = await axios.post(
        url,
        {},
        {
          headers: {
            Authorization: `Basic ${Buffer.from(`${serviceAccountKeyId}:${secretKey}`).toString('base64')}`,
          },
        },
      );

      if (response.data) {
        return response.data.accessToken;
      } else {
        throw new InternalServerErrorException('Token exchange failed');
      }
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'An error occurred during token exchange',
      );
    }
  }
  async authenticateWithCustomId(
    statelessToken: string,
    customIdAuthDto: CustomIdAuthDto,
  ): Promise<any> {
    const { externalId, signInOnly } = customIdAuthDto;
    const projectId = process.env.Project_ID;
    const url = `https://player-auth.services.api.unity.com/v1/projects/${projectId}/authentication/server/custom-id`;

    try {
      const response = await axios.post(
        url,
        {
          externalId: externalId,
          signInOnly: signInOnly,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${statelessToken}`,
          },
        },
      );
      if (response.data) {
        return response.data;
      } else {
        throw new InternalServerErrorException('Token exchange failed');
      }
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'An error occurred during custom ID authentication',
      );
    }
  }
}
