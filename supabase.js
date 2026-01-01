import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://quqxkzzddjmtvoswdbjw.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1cXhrenpkZGptdHZvc3dkYmp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyMDgxNzQsImV4cCI6MjA4MTc4NDE3NH0.cz6Flu4fkFXdxboowLw6FHnHMnhQ64-191mhr70QmzY";

export const supabase = createClient(supabaseUrl, supabaseKey);
