/**
 * Traduz nomes de materiais do banco (salvos em PT-BR) para o idioma ativo.
 * Usa os catálogos multilíngues do MateriaisSugeridos como dicionário bidirecional.
 */
import { getMateriaisPorFase } from '@/components/estoque/MateriaisSugeridos';

type LangMap = Record<string, string>; // PT nome → target lang nome

let cache: Record<string, LangMap> = {};

function buildMap(targetLang: string): LangMap {
  if (cache[targetLang]) return cache[targetLang];

  const ptItems = getMateriaisPorFase('pt-BR').flatMap(f => f.materiais);
  const targetItems = getMateriaisPorFase(targetLang).flatMap(f => f.materiais);

  const map: LangMap = {};
  ptItems.forEach((pt, i) => {
    const target = targetItems[i];
    if (target) map[pt.nome.toLowerCase()] = target.nome;
  });

  cache[targetLang] = map;
  return map;
}

export function translateMaterialName(nome: string, lang: string): string {
  if (!lang || lang === 'pt' || lang === 'pt-BR') return nome;

  // Normalize lang code: 'en' → 'en-US', 'es' → 'es-ES'
  const normalizedLang =
    lang === 'en' ? 'en-US' :
    lang === 'es' ? 'es-ES' :
    lang;

  const map = buildMap(normalizedLang);
  return map[nome.toLowerCase()] ?? nome;
}
