import { dbQuery } from '../database/schema';
import { UserSession } from '../types';
import { FREEMIUM_LIMITS } from '../constants';

export class SessionService {
  private static instance: SessionService;
  private currentSession: UserSession | null = null;
  private isLoaded: boolean = false;
  // Async mutex: serialises concurrent startGuidanceSession / useNextRefresh
  // calls so the read-modify-write on the counter is always atomic from the
  // caller's perspective. Without this, two rapid taps both read the same
  // counter value before either write completes, permanently granting one
  // extra free session per race.
  private operationLock: Promise<void> = Promise.resolve();

  static getInstance(): SessionService {
    if (!SessionService.instance) {
      SessionService.instance = new SessionService();
    }
    return SessionService.instance;
  }

  private constructor() {}

  async initialize(isPremium: boolean): Promise<void> {
    if (this.isLoaded) return;
    await this.loadUserSession(isPremium);
    this.isLoaded = true;
  }

  async loadUserSession(isPremium: boolean): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const session = await dbQuery(async (db) => {
        return (await db.getFirstAsync(`SELECT * FROM user_sessions WHERE date = ?`, [
          today,
        ])) as UserSession | null;
      });

      if (session) {
        this.currentSession = session;
      } else {
        await this.createNewSession(isPremium);
      }
    } catch (error) {
      console.log('Error loading user session:', error);
      this.currentSession = {
        id: `session_${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        guidanceSessionsUsed: 0,
        nextRefreshesRemaining: isPremium ? 999 : FREEMIUM_LIMITS.nextRefreshesPerSession,
        lastResetTime: Date.now(),
      };
    }
  }

  async createNewSession(isPremium: boolean): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const sessionId = `session_${Date.now()}`;
    const newSession: UserSession = {
      id: sessionId,
      date: today,
      guidanceSessionsUsed: 0,
      nextRefreshesRemaining: isPremium ? 999 : FREEMIUM_LIMITS.nextRefreshesPerSession,
      lastResetTime: Date.now(),
    };

    try {
      await dbQuery(async (db) => {
        await db.runAsync(
          `INSERT INTO user_sessions (id, date, guidanceSessionsUsed, nextRefreshesRemaining, lastResetTime)
           VALUES (?, ?, ?, ?, ?)`,
          [
            sessionId,
            today,
            0,
            isPremium ? 999 : FREEMIUM_LIMITS.nextRefreshesPerSession,
            Date.now(),
          ],
        );
      });
      this.currentSession = newSession;
    } catch (error) {
      console.error('Error creating new session:', error);
      this.currentSession = newSession;
    }
  }

  async saveSession(): Promise<void> {
    if (this.currentSession) {
      try {
        await dbQuery(async (db) => {
          await db.runAsync(
            `
            UPDATE user_sessions 
            SET guidanceSessionsUsed = ?, nextRefreshesRemaining = ?
            WHERE id = ?
          `,
            [
              this.currentSession!.guidanceSessionsUsed,
              this.currentSession!.nextRefreshesRemaining,
              this.currentSession!.id,
            ],
          );
        });
      } catch (error) {
        console.error('Error saving session:', error);
      }
    }
  }

  canStartGuidanceSession(isPremium: boolean): boolean {
    if (!this.currentSession) return false;
    if (isPremium) return true;
    return this.currentSession.guidanceSessionsUsed < FREEMIUM_LIMITS.dailyGuidanceSessions;
  }

  async startGuidanceSession(isPremium: boolean): Promise<boolean> {
    let release!: () => void;
    const prev = this.operationLock;
    this.operationLock = new Promise((r) => { release = r; });
    await prev;
    try {
      if (!this.currentSession) return false;
      if (this.canStartGuidanceSession(isPremium)) {
        this.currentSession.guidanceSessionsUsed++;
        this.currentSession.nextRefreshesRemaining = isPremium
          ? 999
          : FREEMIUM_LIMITS.nextRefreshesPerSession;
        await this.saveSession();
        return true;
      }
      return false;
    } finally {
      release();
    }
  }

  canUseNextRefresh(isPremium: boolean): boolean {
    if (!this.currentSession) return false;
    if (isPremium) return true;
    return this.currentSession.nextRefreshesRemaining > 0;
  }

  async useNextRefresh(isPremium: boolean): Promise<boolean> {
    let release!: () => void;
    const prev = this.operationLock;
    this.operationLock = new Promise((r) => { release = r; });
    await prev;
    try {
      if (!this.currentSession) return false;
      if (this.canUseNextRefresh(isPremium)) {
        this.currentSession.nextRefreshesRemaining--;
        await this.saveSession();
        return true;
      }
      return false;
    } finally {
      release();
    }
  }

  getRemainingSessions(isPremium: boolean): number {
    if (!this.currentSession) return 0;
    if (isPremium) return Infinity;
    return Math.max(
      0,
      FREEMIUM_LIMITS.dailyGuidanceSessions - this.currentSession.guidanceSessionsUsed,
    );
  }

  getRemainingRefreshes(isPremium: boolean): number {
    if (!this.currentSession) return 0;
    if (isPremium) return Infinity;
    return Math.max(0, this.currentSession.nextRefreshesRemaining);
  }

  getCurrentSession(): UserSession | null {
    return this.currentSession;
  }

  resetRefreshesToLimit() {
    if (this.currentSession) {
      this.currentSession.nextRefreshesRemaining = FREEMIUM_LIMITS.nextRefreshesPerSession;
    }
  }
}
