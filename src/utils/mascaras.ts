export function mascaraCPF(valor: string): string {
  const n = valor.replace(/\D/g, "").slice(0, 11);
  return n.slice(0, 3) + (n.length > 3 ? "." + n.slice(3, 6) : "")
    + (n.length > 6 ? "." + n.slice(6, 9) : "")
    + (n.length > 9 ? "-" + n.slice(9) : "");
}

export function mascaraCNH(valor: string): string {
  return valor.replace(/\D/g, "").slice(0, 11);
}

export function mascaraTelefone(valor: string): string {
  const n = valor.replace(/\D/g, "").slice(0, 11);
  if (n.length <= 2) return n;
  if (n.length <= 6) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
  return `(${n.slice(0, 2)}) ${n.slice(2, -4)}-${n.slice(-4)}`;
}

export function mascaraPlaca(valor: string): string {
  return valor.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);
}

export function mascaraChassi(valor: string): string {
  return valor.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 17);
}

export function mascaraAno(valor: string): string {
  return valor.replace(/\D/g, "").slice(0, 4);
}
