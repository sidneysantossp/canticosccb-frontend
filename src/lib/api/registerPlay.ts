import { apiFetch } from '../api-helper';

export async function registerPlay(hinoId: number, usuarioId?: number) {
  try {
    const res = await apiFetch('api/hinos/play.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hino_id: hinoId, usuario_id: usuarioId || null })
    });
    if (!res.ok) throw new Error('Falha ao registrar play');
    return await res.json();
  } catch (e) {
    console.warn('registerPlay error', e);
    return null;
  }
}
