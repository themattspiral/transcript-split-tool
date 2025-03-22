const getGridColumnAttributes = (event: React.MouseEvent): NamedNodeMap | undefined => {
  let attrs: NamedNodeMap | undefined = (event.target as HTMLElement).attributes;
  if (!attrs?.length || !attrs.getNamedItem('data-column')) {
    attrs = (event.target as HTMLElement).parentElement?.attributes;
  }
  if (!attrs?.length || !attrs.getNamedItem('data-column')) {
    attrs = (event.target as HTMLElement).parentElement?.parentElement?.attributes;
  }

  return attrs;
};

export { getGridColumnAttributes };
