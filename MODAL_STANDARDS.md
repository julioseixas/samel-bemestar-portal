# Padrões de Modais do Projeto

Este documento define os padrões para implementação de modais no projeto.

## Layout Padrão

Todos os modais devem seguir esta estrutura:

```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="max-w-[95vw] w-full h-[90vh] flex flex-col p-0">
    {/* HEADER FIXO */}
    <DialogHeader className="px-6 py-4 border-b bg-card shrink-0">
      <DialogTitle className="text-xl">Título do Modal</DialogTitle>
      <DialogDescription>
        Descrição do conteúdo do modal
      </DialogDescription>
    </DialogHeader>

    {/* CONTEÚDO SCROLLÁVEL */}
    <div className="flex-1 overflow-y-auto px-6 py-4">
      {/* Seu conteúdo aqui */}
    </div>

    {/* FOOTER FIXO (opcional) */}
    <div className="shrink-0 px-6 py-4 border-t bg-card flex justify-end gap-2 print:hidden">
      <Button variant="outline" onClick={() => setIsOpen(false)}>
        Fechar
      </Button>
      <Button onClick={handleAction}>
        Ação Principal
      </Button>
    </div>
  </DialogContent>
</Dialog>
```

## Classes Importantes

### DialogContent
- `max-w-[95vw]` - Largura máxima de 95% da viewport
- `w-full` - Largura total disponível
- `h-[90vh]` - Altura de 90% da viewport
- `flex flex-col` - Layout flexível em coluna
- `p-0` - Remove padding padrão

### DialogHeader
- `px-6 py-4` - Padding interno
- `border-b` - Borda inferior
- `bg-card` - Cor de fundo do tema
- `shrink-0` - Não permite encolher

### Área de Conteúdo
- `flex-1` - Ocupa todo espaço disponível
- `overflow-y-auto` - Scroll vertical quando necessário
- `px-6 py-4` - Padding interno

### Footer (se necessário)
- `shrink-0` - Não permite encolher
- `px-6 py-4` - Padding interno
- `border-t` - Borda superior
- `bg-card` - Cor de fundo do tema
- `print:hidden` - Esconde na impressão

## Skeleton Loading

Para estados de carregamento, use:

```tsx
{loading ? (
  <div className="space-y-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
        <Skeleton className="h-10 w-[100px]" />
      </div>
    ))}
  </div>
) : (
  // Conteúdo real
)}
```

## Paginação em Modais

Use paginação para listas com mais de 5 itens:

```tsx
const [currentPage, setCurrentPage] = useState(1);
const itemsPerPage = 5;

// Cálculos
const totalPages = Math.ceil(items.length / itemsPerPage);
const startIndex = (currentPage - 1) * itemsPerPage;
const endIndex = startIndex + itemsPerPage;
const currentItems = items.slice(startIndex, endIndex);
```

## Responsividade

O padrão fullscreen (95vw x 90vh) funciona bem em:
- Desktop: Modal grande e confortável
- Tablet: Aproveita bem o espaço
- Mobile: Quase fullscreen, mantendo contexto

## Print Styles

Sempre adicione `print:hidden` em elementos que não devem aparecer na impressão:
- Botões de ação
- Paginação
- Headers/footers de navegação
