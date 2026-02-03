import { Content, ContentAngle } from '../types';
import { quranContent, quranContentAngles } from './quranData';

/**
 * Combined initial content for the application.
 * Currently focuses on curated Quranic content.
 */
export const initialContent: Content[] = quranContent;
export const initialContentAngles: ContentAngle[] = quranContentAngles;
