import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';

const settingsFilePath = path.join(__dirname, '../../data/settings.json');

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

export class SettingsController {
  private ensureDataDir() {
    const dir = path.dirname(settingsFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private readSettingsRaw() {
    this.ensureDataDir();
    if (!fs.existsSync(settingsFilePath)) {
      fs.writeFileSync(settingsFilePath, JSON.stringify(defaultSettings, null, 2), 'utf-8');
      return defaultSettings;
    }
    try {
      const content = fs.readFileSync(settingsFilePath, 'utf-8');
      return { ...defaultSettings, ...JSON.parse(content) };
    } catch (err) {
      console.error('Error reading settings file, returning defaults:', err);
      return defaultSettings;
    }
  }

  public get = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const settings = this.readSettingsRaw();
      res.status(200).json({
        success: true,
        data: settings
      });
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      this.ensureDataDir();
      const current = this.readSettingsRaw();
      const updated = { ...current, ...req.body };
      
      fs.writeFileSync(settingsFilePath, JSON.stringify(updated, null, 2), 'utf-8');
      
      res.status(200).json({
        success: true,
        message: 'Settings updated successfully',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  };
}

export const settingsController = new SettingsController();
