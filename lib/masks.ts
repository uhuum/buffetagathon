/**
 * Aplica máscara de telefone brasileiro: (99) 99999-9999
 */
export function maskTelefone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits.length ? `(${digits}` : ''
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 11)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
}

/**
 * Aplica máscara de CEP: 99999-999
 */
export function maskCep(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

/**
 * Remove todos os caracteres não numéricos
 */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '')
}

/**
 * Retorna link do WhatsApp para um número de telefone
 */
export function whatsappLink(telefone: string): string {
  const digits = digitsOnly(telefone)
  // Adiciona o DDI 55 (Brasil) se não começar com 55
  const number = digits.startsWith('55') ? digits : `55${digits}`
  return `https://wa.me/${number}`
}
