import type { UsersModel } from "../interfaces/database";
import express from "express";
import Logger from "../utils/application/Logger";
import { MethodNameUtils } from "../utils/helpers/MethodNames";
import UserService from "../services/domain/UserService";
import * as fs from "fs";
import * as path from "path";
import { ExceptionEnum } from "../interfaces/enums";
import { ErrorHelper } from "../utils/application/Error";

export class ApiController {
	private controllers: Map<string, any> = new Map();

	constructor() {
		this.initializeControllers();
	}

	private initializeControllers(): void {
		this.controllers.set('api', this);
		
		const controllersPath = path.join(__dirname);
		const controllerFiles = fs.readdirSync(controllersPath)
			.filter(file => (file.endsWith('.js') || file.endsWith('.ts')) && !file.startsWith('ApiController.'));

		for (const file of controllerFiles) {
			const controllerModule = require(path.join(controllersPath, file));
			const ControllerClass = controllerModule.default || controllerModule[Object.keys(controllerModule)[0]];
			
			if (ControllerClass) {
				const controllerName = file.replace(/Controller\.(js|ts)$/, '').toLowerCase();
				this.controllers.set(controllerName, new ControllerClass());
			}
		}
		
		Logger.logInfo(`Loaded ${this.controllers.size} controllers`);
		Logger.logInfo(`Controllers: ${Array.from(this.controllers.keys()).join(', ')}`);
	}

	private async getAuthorizedIdentity(req: any): Promise<UsersModel | null> {
		const access = req.res?.locals?.oauth?.access as string | undefined;
		const userId = req.res?.locals?.oauth?.discordUserId as string | undefined;
		
		Logger.logInfo(`Authorize check for userId=${userId}`);
		if (!userId) 
			return null;
		
		const user = await UserService.getByExternalIdAsync(userId);
		if (!user) 
			return null;

		if (!user.OAuth2AccessToken) 
			return user; // allow first-time link

		if (access && user.OAuth2AccessToken === access) 
			return user;

		return null;
	}

	async handleRequest(req: express.Request, res: express.Response): Promise<void> {
		try {
			const pathParts = req.path.split('/').filter(part => part);
			const method = req.method.toLowerCase();
			
			// Extract controller name from path (first part after /)
			const controllerName = pathParts[0]?.toLowerCase();
			if (!controllerName) {
				res.status(404).json({ error: "Controller not found" });
				return;
			}

			// Get controller instance
			const controller = this.controllers.get(controllerName);
			if (!controller) {
				res.status(404).json({ error: `Controller ${controllerName} not found` });
				return;
			}

			// Find method to call based on HTTP method and path
			const methodName = this.findMethodName(controllerName, method, pathParts);
			if (!methodName) {
				res.status(404).json({ error: `Method not found for ${method} ${req.path}` });
				return;
			}

			// Check if method exists on controller
			if (typeof controller[methodName] !== 'function') {
				res.status(404).json({ error: `Method ${methodName} not found on ${controllerName}` });
				return;
			}

			// Parameter validation and authorization happens here
			const validatedParams = await this.validateAndExtractParameters(req, controllerName, methodName, pathParts);
			const result = await controller[methodName](...validatedParams);
			
			res.json(result);
		} catch (error) {
			Logger.logError("Error in handleRequest:", error as Error);
			res.status(500).json({ error: "Internal server error" });
		}
	}

	private findMethodName(controllerName: string, httpMethod: string, pathParts: string[]): string | null {
		const controller = this.controllers.get(controllerName);
		if (!controller) return null;

		// Get all method names from the controller
		const availableMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(controller))
			.filter(name => name !== 'constructor' && typeof controller[name] === 'function');

		// Try to find method by removing Async suffix and matching path
		const methodNameFromPath = pathParts[1];
		if (methodNameFromPath) {
			const methodWithoutAsync = availableMethods.find(method => {
				const cleanMethod = MethodNameUtils.removeAsyncSuffix(method).toLowerCase();
				return cleanMethod === methodNameFromPath.toLowerCase();
			});
			
			if (methodWithoutAsync)
				return methodWithoutAsync;
		}

		// Look for methods based on path structure
		if (pathParts.length === 1) {
			// Single resource: look for methods like getAll, getList, etc.
			const collectionMethods = availableMethods.filter(method => 
				method.toLowerCase().includes('all') || 
				method.toLowerCase().includes('list') ||
				method.toLowerCase().includes('get') && !method.toLowerCase().includes('by')
			);
			if (collectionMethods.length > 0)
				return collectionMethods[0];
		} else if (pathParts.length === 2) {
			// Resource with ID: look for methods like getById, findById, etc.
			const byIdMethods = availableMethods.filter(method => 
				method.toLowerCase().includes('byid') ||
				method.toLowerCase().includes('by') ||
				method.toLowerCase().includes('find')
			);
			if (byIdMethods.length > 0)
				return byIdMethods[0];
		}

		// Fallback: return first available method
		return availableMethods.length > 0 ? availableMethods[0] : null;
	}

	private async validateAndExtractParameters(req: express.Request, controllerName: string, methodName: string, pathParts: string[]): Promise<any[]> {
		const controller = this.controllers.get(controllerName);
		if (!controller) 
			return [];

		// Get method signature to determine parameter types
		const method = controller[methodName];
		if (!method) 
			return [];

		// Get method parameter names from function signature
		const methodString = method.toString();
		const paramMatch = methodString.match(/\(([^)]*)\)/);
		if (!paramMatch) 
			return [];

		const paramNames = paramMatch[1]
			.split(',')
			.map((p: string) => p.trim())
			.filter((p: string) => p);

		const params: any[] = [];
		
		let pathParamIndex = 2; // Start after controller and method name
		
		for (let i = 0; i < paramNames.length; i++) {
			const paramName = paramNames[i];
			
			// Check if parameter is identity: User
			if (paramName.includes('identity') && paramName.includes('User')) {
				const identity = await this.getAuthorizedIdentity(req);
				if (!identity) 
					ErrorHelper.throw(ExceptionEnum.UNAUTHORIZED);
				
				params.push(identity);
				continue;
			}

			const cleanParamName = paramName.split(':')[0].trim();
			
			// Try to get parameter from URL path first (for path parameters)
			if (pathParamIndex < pathParts.length) {
				const pathParam = pathParts[pathParamIndex];
				params.push(pathParam);
				pathParamIndex++;
				continue;
			}
			
			if (req.params[cleanParamName]) {
				params.push(req.params[cleanParamName]);
				continue;
			}
			
			if (req.query[cleanParamName]) {
				params.push(req.query[cleanParamName]);
				continue;
			}
			
			if (req.body && req.body[cleanParamName]) {
				params.push(req.body[cleanParamName]);
				continue;
			}
			
			// For POST/PUT requests, the entire body might be the parameter
			if ((req.method.toLowerCase() === 'post' || req.method.toLowerCase() === 'put') && req.body) {
				params.push(req.body);
				continue;
			}

			// If no parameter found, push undefined
			params.push(undefined);
		}

		return params;
	}
}
