import ContentService from '../content.service';
import DynamicContentService from './dynamicContent.service';

export default class DynamicContentDomComponents {
  dcService;

  static addDynamicContentType(editor) {
    const dc = editor.DomComponents;
    const baseTypeName = ContentService.isMjmlMode(editor) ? 'mj-text' : 'text';
    const tagName = ContentService.isMjmlMode(editor) ? 'mj-text' : 'div';
    const baseType = dc.getType(baseTypeName);
    const baseModel = baseType.model;

    const dynamicContentModel = {
      name: 'Dynamic Content',
      tagName,
      draggable: '[data-gjs-type=cell],[data-gjs-type=mj-column]',
      droppable: false,
      editable: false,
      stylable: false,
      propagate: ['droppable', 'editable'],
      style: baseModel.prototype.defaults['style-default'],
      attributes: {
        'data-gjs-type': 'dynamic-content', // Type for GrapesJS
        'data-slot': 'dynamicContent', // used to find the DC component on the canvas for e.g. token transformation
      },
    };

    const model = {
      defaults: { ...baseModel.prototype.defaults, ...dynamicContentModel },
      /**
       * Initilize the component
       */
      init() {
        // link component to the corresponding html store item
        this.em
          .get('Commands')
          .run('preset-mautic:link-component-to-store-item', { component: this });

        // Add toolbar edit button if it's not already in
        const toolbar = this.get('toolbar');
        const id = 'toolbar-dynamic-content';

        if (!toolbar.filter((tlb) => tlb.id === id).length) {
          toolbar.unshift({
            id,
            command: 'preset-mautic:dynamic-content-open',
            attributes: { class: 'fa fa-pencil-square-o' },
          });
        }
      },
      // @todo: show the store items default content on the canvas
      // updated(property, value, prevValue) {
      //   console.debug('Local hook: model.updated', {
      //     property,
      //     value,
      //     prevValue,
      //   });
      // },
      // does not work: gets removed when Sorting (by grapesjs)
      // removed() {
      //   // Delete dynamic-content on Mautic side
      //   const component = this.model;
      //   this.em
      //     .get('Commands')
      //     .run('preset-mautic:dynamic-content-delete-store-item', { component });
      // },
    };

    const view = {
      attributes: {
        style: 'pointer-events: all; display: table; width: 100%;user-select: none;',
      },
      events: {
        dblclick: 'onActive',
      },
      // replace token with human readable view
      // eslint-disable-next-line no-shadow
      onRender({ editor, model }) {
        const dcService = new DynamicContentService(editor);
        const decId = DynamicContentService.getDataParamDecid(model);
        const dcItem = dcService.getStoreItem(decId);
        if (typeof dcItem !== 'undefined') {
          this.el.innerHTML = dcItem.content;
          dcService.logger.debug('DC: Updated view', dcItem);
        }
      },
      // open the dynamic content modal if the editor is added or double clicked
      onActive() {
        const target = this.model;
        // open the editor in the popup
        this.em.get('Commands').run('preset-mautic:dynamic-content-open', { target });
      },
    };

    // add the Dynamic Content component
    dc.addType('dynamic-content', {
      // Dynamic Content component detection
      isComponent: (el) => {
        if (
          typeof el.getAttribute !== 'undefined' &&
          el.getAttribute('data-slot') === 'dynamicContent'
        ) {
          return {
            type: 'dynamic-content',
          };
        }
        return false;
      },
      model,
      view,
    });
  }
}
