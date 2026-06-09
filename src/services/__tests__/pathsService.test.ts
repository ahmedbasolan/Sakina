import { PathsService } from '../pathsService';
import { STATIC_SPIRITUAL_PATHS } from '../../data/staticPaths';

jest.mock('../supabaseDataService', () => ({
  SupabaseDataService: { getInstance: () => ({}) },
}));

describe('PathsService free-core access', () => {
  const service = PathsService.getInstance();

  it('returns every static journey to free users (nothing gated)', () => {
    const ids = service.getAllPaths(false, []).map((p) => p.id).sort();
    const allIds = STATIC_SPIRITUAL_PATHS.map((p) => p.id).sort();
    expect(ids).toEqual(allIds);
  });

  it('exposes distress journeys to free users', () => {
    const ids = service.getAllPaths(false, []).map((p) => p.id);
    expect(ids).toContain('path_addiction_recovery');
    expect(ids).toContain('path_grief_loss');
    expect(ids).toContain('path_tawbah_intensive');
  });

  it('returns the same set regardless of premium status', () => {
    const free = service.getAllPaths(false, []).map((p) => p.id).sort();
    const premium = service.getAllPaths(true, []).map((p) => p.id).sort();
    expect(free).toEqual(premium);
  });
});
