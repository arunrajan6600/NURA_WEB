"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const env_1 = require("./env");
const prismaClientSingleton = () => {
    return new client_1.PrismaClient({
        log: env_1.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
};
const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();
exports.default = prisma;
if (env_1.env.NODE_ENV !== 'production') {
    globalThis.prismaGlobal = prisma;
}
