import content from './content.json'
import type { LineYear, School, SyllabusNode } from '../types'

export const schools = content.schools as School[]
export const lineHistory = content.lineHistory as LineYear[]
export const syllabus = content.syllabus as unknown as Record<string, SyllabusNode[]>
