import { config } from 'dotenv';
config();

import '@/ai/flows/synonym-suggestions.ts';
import '@/ai/flows/advanced-text-correction.ts';
import '@/ai/flows/grammar-check.ts';
import '@/ai/flows/spell-check.ts';