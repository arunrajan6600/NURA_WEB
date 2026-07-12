"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const env_1 = require("./env");
if (!env_1.env.SUPABASE_URL || !env_1.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('⚠️  Supabase environment variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) are not set. Storage integration will be disabled or fail.');
}
const supabaseUrl = env_1.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = env_1.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key';
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    },
});
