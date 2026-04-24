import { Content, ContentAngle } from '../types';
import { quranContent, quranContentAngles } from './quranData';
import { sunnahContentData } from './sunnahData';

/**
 * Combined initial content for the application.
 * Focuses on curated Quranic and Sunnah content.
 */
export const initialContent: Content[] = [...quranContent, ...sunnahContentData];
export const initialContentAngles: ContentAngle[] = quranContentAngles;
