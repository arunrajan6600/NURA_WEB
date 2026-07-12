"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsController = exports.SettingsController = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const settingsFilePath = path_1.default.join(__dirname, '../../data/settings.json');
const defaultSettings = {
    siteName: "Arun Nura",
    logoUrl: "/logo.svg",
    faviconUrl: "/favicon.ico",
    theme: "system",
    socialTwitter: "https://twitter.com/arunnura",
    socialLinkedin: "https://linkedin.com/in/arunnura",
    socialGithub: "https://github.com/arunrajan6600",
    seoTitle: "Arun Nura | Multi-disciplinary Art Practitioner",
    seoDescription: "Portfolio of Arun Nura, a multi-disciplinary art practitioner specializing in visual practices, experimental films, performance art and AI-code art.",
    contactEmail: "arunrajan6600@gmail.com",
    analyticsId: "G-XXXXXXX"
};
class SettingsController {
    ensureDataDir() {
        const dir = path_1.default.dirname(settingsFilePath);
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
    }
    readSettingsRaw() {
        this.ensureDataDir();
        if (!fs_1.default.existsSync(settingsFilePath)) {
            fs_1.default.writeFileSync(settingsFilePath, JSON.stringify(defaultSettings, null, 2), 'utf-8');
            return defaultSettings;
        }
        try {
            const content = fs_1.default.readFileSync(settingsFilePath, 'utf-8');
            return { ...defaultSettings, ...JSON.parse(content) };
        }
        catch (err) {
            console.error('Error reading settings file, returning defaults:', err);
            return defaultSettings;
        }
    }
    get = async (_req, res, next) => {
        try {
            const settings = this.readSettingsRaw();
            res.status(200).json({
                success: true,
                data: settings
            });
        }
        catch (error) {
            next(error);
        }
    };
    update = async (req, res, next) => {
        try {
            this.ensureDataDir();
            const current = this.readSettingsRaw();
            const updated = { ...current, ...req.body };
            fs_1.default.writeFileSync(settingsFilePath, JSON.stringify(updated, null, 2), 'utf-8');
            res.status(200).json({
                success: true,
                message: 'Settings updated successfully',
                data: updated
            });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.SettingsController = SettingsController;
exports.settingsController = new SettingsController();
