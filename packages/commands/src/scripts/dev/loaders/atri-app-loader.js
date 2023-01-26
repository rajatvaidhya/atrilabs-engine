function atriAppLoader() {
  return `
  	import PageWrapper from "./pages/_app";
	import universalRender from "@atrilabs/atri-app-core/src/entries/universalRender";

    module.exports = { PageWrapper, universalRender };
	`;
}

module.exports = atriAppLoader;
