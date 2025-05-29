export const getGridColumnAttributes = (event: React.MouseEvent): NamedNodeMap | undefined => {
  let attrs: NamedNodeMap | undefined = (event.target as HTMLElement).attributes;
  if (!attrs?.length || !attrs.getNamedItem('data-column')) {
    attrs = (event.target as HTMLElement).parentElement?.attributes;
  }
  if (!attrs?.length || !attrs.getNamedItem('data-column')) {
    attrs = (event.target as HTMLElement).parentElement?.parentElement?.attributes;
  }
  
  return attrs;
};

const TEXT_NODE_NAME = '#text';

export const getSelectionRangeContainerAttribute = (node: Node | undefined, attribute: string): string | undefined => {
  if (!node || !attribute) {
    return undefined;
  }

  let value: string | undefined = undefined;
  
  if (node.nodeName === TEXT_NODE_NAME) {
    value = node.parentElement?.attributes?.getNamedItem(attribute)?.value 
  } else {
    value = (node as HTMLElement)?.attributes?.getNamedItem(attribute)?.value;
  }
  return value;
};

export const clearDocumentTextSelection = () => {
  document.getSelection()?.empty();
};

export const deepCopyObject = (obj: any): any => JSON.parse(JSON.stringify(obj));
