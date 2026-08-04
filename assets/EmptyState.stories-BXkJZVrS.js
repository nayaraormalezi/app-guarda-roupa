import{u as x,r as j,j as a,V as b,s as S}from"./iframe-BLb4lv5k.js";import{T as r,f as n}from"./typography-BmYJbymn.js";import{M as k}from"./index-DBUjjcgb.js";import"./preload-helper-B0jwllu1.js";function h({title:e,subtitle:i,cta:l,onPress:d}){const{colors:c}=x(),t=j.useMemo(()=>T(c),[c]);return a.jsxs(b,{style:t.wrap,children:[a.jsx(r,{style:t.title,children:e}),i?a.jsx(r,{style:t.sub,children:i}):null,l&&d?a.jsx(k,{style:t.cta,onPress:d,children:a.jsx(r,{style:t.ctaText,children:l})}):null]})}function T(e){return S.create({wrap:{padding:24,alignItems:"center",justifyContent:"center",gap:8},title:{fontFamily:n.displayMedium,fontSize:18,color:e.ink,textAlign:"center"},sub:{fontFamily:n.body,fontSize:13,color:e.muted,textAlign:"center",lineHeight:19,maxWidth:280},cta:{marginTop:10,backgroundColor:e.ink,borderRadius:14,paddingHorizontal:18,paddingVertical:12},ctaText:{fontFamily:n.bodyMedium,fontSize:13,color:e.white}})}h.__docgenInfo={description:"",methods:[],displayName:"EmptyState",props:{title:{required:!0,tsType:{name:"string"},description:""},subtitle:{required:!1,tsType:{name:"string"},description:""},cta:{required:!1,tsType:{name:"string"},description:""},onPress:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:""}}};const M={title:"Components/EmptyState",component:h},s={args:{title:"Nenhuma peça ainda",subtitle:"Adicione peças ao closet para montar looks."}},o={args:{title:"Nenhum look salvo",subtitle:"Salve looks do planejador ou do stylist.",cta:"Ver planejador",onPress:()=>{}}};var p,m,u;s.parameters={...s.parameters,docs:{...(p=s.parameters)==null?void 0:p.docs,source:{originalSource:`{
  args: {
    title: "Nenhuma peça ainda",
    subtitle: "Adicione peças ao closet para montar looks."
  }
}`,...(u=(m=s.parameters)==null?void 0:m.docs)==null?void 0:u.source}}};var y,f,g;o.parameters={...o.parameters,docs:{...(y=o.parameters)==null?void 0:y.docs,source:{originalSource:`{
  args: {
    title: "Nenhum look salvo",
    subtitle: "Salve looks do planejador ou do stylist.",
    cta: "Ver planejador",
    onPress: () => undefined
  }
}`,...(g=(f=o.parameters)==null?void 0:f.docs)==null?void 0:g.source}}};const N=["Default","WithCta"];export{s as Default,o as WithCta,N as __namedExportsOrder,M as default};
