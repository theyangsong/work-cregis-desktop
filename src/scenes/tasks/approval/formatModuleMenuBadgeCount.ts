/** Module menu EgMessage：0 展示 "0"；>99 展示 99+。 */
export function formatModuleMenuBadgeCount(count: number): string {
  if (count <= 0) return '0';
  if (count > 99) return '99+';
  return String(count);
}
