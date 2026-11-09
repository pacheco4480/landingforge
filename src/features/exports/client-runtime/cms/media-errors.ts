export type ClientCmsMediaErrorCode =
  | "invalid_file"
  | "storage_not_configured"
  | "storage_unavailable"
  | "media_not_found"
  | "media_in_use";

const messages: Record<ClientCmsMediaErrorCode, string> = {
  invalid_file: "Seleciona uma imagem suportada até 10 MB.",
  storage_not_configured: "O carregamento de imagens não está configurado nesta instalação. Contacta o suporte do site.",
  storage_unavailable: "Não foi possível comunicar com o armazenamento de imagens. Tenta novamente mais tarde.",
  media_not_found: "O ficheiro já não está disponível nesta instalação. Atualiza a página.",
  media_in_use: "Esta imagem está a ser utilizada numa secção. Substitui-a antes de a eliminar.",
};

export class ClientCmsMediaError extends Error {
  readonly code: ClientCmsMediaErrorCode;

  constructor(code: ClientCmsMediaErrorCode) {
    super(messages[code]);
    this.name = "ClientCmsMediaError";
    this.code = code;
  }
}
