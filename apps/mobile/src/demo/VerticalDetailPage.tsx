import type React from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import type { OfflineDemoAction } from './offline-demo';
import { verticalDetailForId, type MatterIcon, type VerticalDetail } from './vertical-detail';
import { subverticalPortfolioForPathway } from './subvertical-projects';

const whiteFade = require('../../assets/verticals/white-fade-left.png');
const serifFamily = Platform.select({ android: 'serif', ios: 'Georgia', web: 'Georgia, Times New Roman, serif' });
const sansFamily = Platform.select({ android: 'sans-serif', ios: 'System', web: 'Arial, Helvetica, sans-serif' });
const gold = '#B18435';
const matterIconSets: Record<string, MatterIcon[]> = {
  'infrastructure-urban-development':['place','connection','resilience'], 'ports-airports-logistics':['connection','flow','continuity'],
  'energy-utilities':['resilience','energy','stewardship'], 'healthcare-life-sciences':['care','connection','continuity'],
  'hospitality-tourism-leisure':['place','care','stewardship'], 'real-estate-asset-development':['continuity','place','stewardship'],
  'manufacturing-industrial-solutions':['learning','resilience','stewardship'], 'spiritual-renaissance-for-bharat':['continuity','learning','place'],
  'education-technology-innovation':['learning','connection','continuity'],
};

export function VerticalDetailPage({ verticalId, onAction }: { verticalId: string; onAction: (action: OfflineDemoAction) => void }): React.ReactElement {
  const vertical = verticalDetailForId(verticalId);
  return <UniversalVerticalPage onAction={onAction} vertical={vertical} />;
}

function openPathway(vertical: VerticalDetail, title: string, onAction: (action: OfflineDemoAction) => void) {
  onAction({ type: 'select-subvertical', subverticalId: subverticalPortfolioForPathway(vertical.id, title).id });
}

const iconLabels: Record<MatterIcon, string> = {
  continuity: 'Care continuity path icon', connection: 'Connected systems network icon', resilience: 'Resilient foundation icon',
  learning: 'Learning and discovery icon', place: 'Sense of place icon', energy: 'Responsible energy icon',
  care: 'Continuous care heart icon', flow: 'Dependable flow icon', stewardship: 'Long-term stewardship icon',
};

/** Dependency-free semantic line icons sharing the locked local gold outline treatment. */
function WhyIcon({ variant, label }: { variant: MatterIcon; label?: string }) {
  const accessibilityLabel = label ?? iconLabels[variant];
  if (variant === 'care') return <View accessibilityLabel={accessibilityLabel} style={s.lineIcon}><View style={[s.heartLobe,{left:5}]} /><View style={[s.heartLobe,{right:5}]} /><View style={s.heartPoint} /></View>;
  if (variant === 'connection' || variant === 'flow') return <View accessibilityLabel={accessibilityLabel} style={s.lineIcon}><View style={[s.connector,s.connectorLeft]} /><View style={[s.connector,s.connectorRight]} /><View style={[s.node,s.nodeTop]} /><View style={[s.node,s.nodeLeft]} /><View style={[s.node,s.nodeRight]} /></View>;
  if (variant === 'continuity') return <View accessibilityLabel={accessibilityLabel} style={s.lineIcon}><View style={s.continuityRing} /><View style={s.continuityArrow} /></View>;
  if (variant === 'energy') return <View accessibilityLabel={accessibilityLabel} style={s.lineIcon}><View style={s.bolt} /><View style={s.boltCut} /></View>;
  if (variant === 'learning') return <View accessibilityLabel={accessibilityLabel} style={s.lineIcon}><View style={[s.book,s.bookLeft]} /><View style={[s.book,s.bookRight]} /><View style={s.bookSpine} /></View>;
  if (variant === 'place') return <View accessibilityLabel={accessibilityLabel} style={s.lineIcon}><View style={s.pin}><View style={s.pinDot} /></View></View>;
  return <View accessibilityLabel={accessibilityLabel} style={s.lineIcon}><View style={s.shield} /><View style={s.shieldLine} /></View>;
}

function UniversalVerticalPage({ vertical, onAction }: { vertical: VerticalDetail; onAction: (action: OfflineDemoAction) => void }) {
  const healthcare = vertical.id === 'healthcare-life-sciences';
  const compactHeroTitle = vertical.id === 'ports-airports-logistics' || vertical.id === 'manufacturing-industrial-solutions';
  const prefix = healthcare ? 'healthcare' : vertical.id;
  const title = healthcare ? <>Healthcare &{`\n`}Life Sciences</> : vertical.title;
  const exploreName = vertical.title.split(/[,&]/)[0].trim().toUpperCase();
  return <View style={s.page} testID={`vertical-detail-${vertical.id}`}>
    <View style={s.hero} testID="vertical-hero">
      <Image accessibilityLabel={`${vertical.title} hero`} resizeMode="cover" source={vertical.hero} style={s.heroImage} />
      <Image resizeMode="stretch" source={whiteFade} style={s.heroFade} testID="vertical-white-hero-fade" />
      <View style={s.heroCopy}>
        <Text adjustsFontSizeToFit minimumFontScale={0.72} numberOfLines={3} style={[s.heroTitle, compactHeroTitle && s.compactHeroTitle]} testID="vertical-hero-title">{title}</Text>
        <Text ellipsizeMode="tail" numberOfLines={6} style={s.intro} testID="vertical-hero-description">{vertical.intro}</Text>
      </View>
    </View>
    <View style={s.explore}>
      <Text style={s.eyebrow}>EXPLORE {exploreName}</Text><Text style={s.sectionTitle}>Choose a pathway</Text>
      <Text style={s.sectionSubtitle}>Select a sub-vertical to view its projects, milestones and latest progress.</Text><View style={s.goldRule} />
      <View style={s.cards} testID="pathway-list">{vertical.pathways.map((item,index) => <Pressable accessibilityLabel={`Explore ${item.title}`} accessibilityRole="button" key={item.title} onPress={() => openPathway(vertical,item.title,onAction)} style={s.card} testID={`vertical-pathway-${index+1}`}>
        <Image accessibilityLabel={`${item.title} pathway`} resizeMode="cover" source={item.image} style={s.cardImage} />
        <View style={s.cardCopy} testID={`vertical-pathway-copy-${index+1}`}><Text ellipsizeMode="tail" numberOfLines={3} style={s.cardTitle} testID={`vertical-pathway-title-${index+1}`}>{item.title}</Text><Text numberOfLines={1} style={s.cardDescription} testID={`vertical-pathway-description-${index+1}`}>{item.description}</Text><Text style={s.cardArrow}>→</Text></View>
      </Pressable>)}</View>
    </View>
    <View style={s.matters}><Text style={s.eyebrow}>WHY IT MATTERS</Text><Text style={s.mattersTitle}>{vertical.mattersTitle}</Text>
      <View testID="matters-list">{vertical.matters.map((item,index) => <View key={item.title} style={s.matterRow} testID={`vertical-matter-${index+1}`}><View style={s.iconCircle}><WhyIcon label={healthcare ? ['Continuous care heart icon','Connected care network icon','Care continuity path icon'][index] : item.iconLabel} variant={matterIconSets[vertical.id][index]} /></View><View style={s.matterCopy}><Text style={s.matterTitle}>{item.title}</Text><Text style={s.matterText}>{item.copy}</Text></View></View>)}</View>
    </View>
  </View>;
}

const s=StyleSheet.create({
  page:{backgroundColor:'#FAF8F3',marginHorizontal:-16,marginTop:-16,paddingBottom:0},hero:{backgroundColor:'#FFF',height:202,overflow:'hidden',position:'relative'},heroImage:{bottom:0,height:'100%',position:'absolute',right:0,top:0,width:'68%'},heroFade:{bottom:0,height:'100%',left:'32%',position:'absolute',width:'37%'},heroCopy:{bottom:0,justifyContent:'center',left:0,paddingLeft:20,position:'absolute',top:0,width:'54%'},heroTitle:{color:'#171814',fontFamily:serifFamily,fontSize:25,lineHeight:24},compactHeroTitle:{fontSize:22,lineHeight:22},intro:{color:'#4F4D47',fontFamily:sansFamily,fontSize:10,lineHeight:14,marginTop:9},explore:{backgroundColor:'#FFFEFB',paddingBottom:25,paddingHorizontal:20,paddingTop:20},eyebrow:{color:'#B18435',fontSize:7,fontWeight:'900',letterSpacing:.75,marginBottom:5},sectionTitle:{color:'#20211D',fontFamily:serifFamily,fontSize:22,lineHeight:25},sectionSubtitle:{color:'#66635C',fontSize:12,lineHeight:16,marginTop:3},goldRule:{backgroundColor:'#C79A43',height:2,marginBottom:12,marginTop:9,width:25},cards:{gap:7},card:{backgroundColor:'#FFF',borderColor:'#DED8CC',borderRadius:10,borderWidth:1,flexDirection:'row',height:101,overflow:'hidden'},cardImage:{height:'100%',width:'44%'},cardCopy:{flex:1,justifyContent:'center',paddingLeft:12,paddingRight:25,paddingVertical:4,position:'relative'},cardTitle:{color:'#24241F',fontFamily:serifFamily,fontSize:16,lineHeight:17},cardDescription:{color:'#5E5B54',fontFamily:sansFamily,fontSize:9,lineHeight:12,marginTop:7,paddingRight:3},cardArrow:{bottom:7,color:'#C39135',fontSize:17,position:'absolute',right:8},matters:{backgroundColor:'#F1EEE7',paddingBottom:16,paddingHorizontal:20,paddingTop:18},mattersTitle:{color:'#22231F',fontFamily:serifFamily,fontSize:19,lineHeight:23,marginBottom:8},matterRow:{alignItems:'center',borderTopColor:'#D4CEC2',borderTopWidth:1,flexDirection:'row',gap:12,minHeight:67,paddingVertical:10},iconCircle:{alignItems:'center',borderColor:'#AFA99E',borderRadius:20,borderWidth:1,height:38,justifyContent:'center',width:38},lineIcon:{height:24,position:'relative',width:24},heartLobe:{borderColor:gold,borderRadius:6,borderWidth:1.5,height:11,position:'absolute',top:4,width:10},heartPoint:{borderBottomColor:gold,borderBottomWidth:1.5,borderRightColor:gold,borderRightWidth:1.5,height:12,left:6,position:'absolute',top:7,transform:[{rotate:'45deg'}],width:12},connector:{backgroundColor:gold,height:1.5,position:'absolute',top:12,width:10},connectorLeft:{left:4,transform:[{rotate:'-55deg'}]},connectorRight:{right:4,transform:[{rotate:'55deg'}]},node:{backgroundColor:'#F1EEE7',borderColor:gold,borderRadius:4,borderWidth:1.5,height:7,position:'absolute',width:7},nodeTop:{left:8.5,top:1},nodeLeft:{bottom:2,left:1},nodeRight:{bottom:2,right:1},continuityRing:{borderColor:gold,borderRadius:9,borderWidth:1.5,height:18,left:3,position:'absolute',top:3,width:18},continuityArrow:{borderRightColor:gold,borderRightWidth:1.5,borderTopColor:gold,borderTopWidth:1.5,height:6,position:'absolute',right:1,top:4,transform:[{rotate:'20deg'}],width:6},bolt:{borderBottomColor:gold,borderBottomWidth:12,borderLeftColor:'transparent',borderLeftWidth:6,borderRightColor:'transparent',borderRightWidth:2,height:0,left:7,position:'absolute',top:1,transform:[{rotate:'-8deg'}],width:0},boltCut:{borderTopColor:gold,borderTopWidth:12,borderLeftColor:'transparent',borderLeftWidth:2,borderRightColor:'transparent',borderRightWidth:6,bottom:1,height:0,left:9,position:'absolute',width:0},book:{borderColor:gold,borderWidth:1.5,height:16,position:'absolute',top:4,width:10},bookLeft:{borderRadius:2,left:2,transform:[{skewY:'8deg'}]},bookRight:{borderRadius:2,right:2,transform:[{skewY:'-8deg'}]},bookSpine:{backgroundColor:gold,height:17,left:11.25,position:'absolute',top:4,width:1.5},pin:{borderColor:gold,borderRadius:9,borderWidth:1.5,height:18,left:3,position:'absolute',top:1,transform:[{rotate:'45deg'}],width:18},pinDot:{borderColor:gold,borderRadius:3,borderWidth:1.5,height:6,left:4.5,position:'absolute',top:4.5,width:6},shield:{borderBottomLeftRadius:8,borderBottomRightRadius:8,borderColor:gold,borderTopLeftRadius:3,borderTopRightRadius:3,borderWidth:1.5,height:20,left:4,position:'absolute',top:2,width:16},shieldLine:{backgroundColor:gold,height:1.5,left:8,position:'absolute',top:11,transform:[{rotate:'45deg'}],width:8},matterCopy:{flex:1},matterTitle:{color:'#282823',fontFamily:serifFamily,fontSize:11.5,fontWeight:'700',lineHeight:15,marginBottom:2},matterText:{color:'#5E5B54',fontFamily:sansFamily,fontSize:9,lineHeight:12}
});
