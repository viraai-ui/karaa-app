import type React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/tokens';
import type { OfflineDemoAction } from './offline-demo';
import { verticalDetailForId } from './vertical-detail';
import { subverticalPortfolioForPathway } from './subvertical-projects';

export function VerticalDetailPage({ verticalId, onAction }: { verticalId: string; onAction: (action: OfflineDemoAction) => void }): React.ReactElement {
  const vertical = verticalDetailForId(verticalId);
  return <View style={styles.page} testID={`vertical-detail-${vertical.id}`}>
    <Pressable accessibilityLabel="Back to Power of 9" accessibilityRole="button" onPress={() => onAction({ type:'back-to-root' })} style={styles.back}><Text style={styles.backArrow}>‹</Text><Text style={styles.backText}>POWER OF 9</Text></Pressable>
    <View style={styles.hero}>
      <Image accessibilityLabel={`${vertical.title} hero`} resizeMode="cover" source={vertical.hero} style={styles.heroImage} />
      <View style={styles.heroShade} />
      <View style={styles.heroCopy}><Text style={styles.heroEyebrow}>POWER OF 9  •  {vertical.number}</Text><Text style={styles.heroTitle}>{vertical.title}</Text><Text style={styles.intro}>{vertical.intro}</Text><Text style={styles.buildLabel}>BUILD WITH KARAA</Text></View>
    </View>

    <View style={styles.sectionHead}><Text style={styles.eyebrow}>EXPLORE {vertical.title.split(/[,&]/)[0].trim().toUpperCase()}</Text><Text style={styles.sectionTitle}>Choose a pathway</Text><Text style={styles.sectionSubtitle}>Select a sub-vertical to view its projects, milestones and latest progress.</Text></View>
    <View testID="pathway-list" style={styles.cards}>{vertical.pathways.map((item,index)=><Pressable accessibilityLabel={`Explore ${item.title}`} accessibilityRole="button" key={item.title} onPress={() => onAction({ type:'select-subvertical', subverticalId:subverticalPortfolioForPathway(vertical.id,item.title).id })} style={styles.card}>
      <Image accessibilityLabel={`${item.title} pathway`} resizeMode="cover" source={item.image} style={styles.cardImage} />
      <View style={styles.cardCopy}><Text style={styles.cardNumber}>{String(index+1).padStart(2,'0')}   ◇</Text><Text numberOfLines={2} style={styles.cardTitle}>{item.title}</Text><Text numberOfLines={2} style={styles.cardDescription}>{item.description}</Text><Text style={styles.cardArrow}>→</Text></View>
    </Pressable>)}</View>

    <View style={styles.mattersHeader}><Text style={styles.eyebrow}>WHY IT MATTERS</Text><Text style={styles.mattersTitle}>{vertical.mattersTitle}</Text></View>
    <View testID="matters-list" style={styles.matters}>{vertical.matters.map((item)=><View key={item.title} style={styles.matterRow}><View style={styles.iconCircle}><Text style={styles.icon}>{item.icon}</Text></View><View style={styles.matterCopy}><Text style={styles.matterTitle}>{item.title}</Text><Text style={styles.matterText}>{item.copy}</Text></View></View>)}</View>
  </View>;
}

const styles=StyleSheet.create({
  page:{ marginHorizontal:-16, marginTop:-16, paddingBottom:8 },
  back:{ alignItems:'center', backgroundColor:'#0A0B0A', flexDirection:'row', gap:5, minHeight:44, paddingHorizontal:16 },
  backArrow:{ color:'#D4AE5A', fontSize:22, lineHeight:22 }, backText:{ color:'#E9E4D8', fontSize:8, fontWeight:'800', letterSpacing:1.1 },
  hero:{ backgroundColor:'#151613', height:228, overflow:'hidden', position:'relative' },
  heroImage:{ height:'100%', position:'absolute', right:0, width:'57%' },
  heroShade:{ backgroundColor:'rgba(11,12,10,.23)', bottom:0, left:'38%', position:'absolute', right:0, top:0 },
  heroCopy:{ backgroundColor:'#F8F5ED', bottom:0, justifyContent:'center', left:0, paddingHorizontal:17, position:'absolute', top:0, width:'57%' },
  heroEyebrow:{ color:'#D4AE5A', fontSize:8, fontWeight:'800', letterSpacing:1.1, marginBottom:11 },
  heroTitle:{ color:'#24241F', fontFamily:'serif', fontSize:27, lineHeight:29 },
  intro:{ color:'#55524B', fontSize:9, lineHeight:13, marginTop:10 }, buildLabel:{ color:'#A47E2B', fontSize:7, fontWeight:'900', letterSpacing:.8, marginTop:12 },
  sectionHead:{ backgroundColor:'#FCFAF5', paddingHorizontal:18, paddingBottom:12, paddingTop:22 },
  eyebrow:{ color:'#A47E2B', fontSize:8, fontWeight:'900', letterSpacing:1.25, marginBottom:7 },
  sectionTitle:{ color:colors.ink, fontFamily:'serif', fontSize:25, lineHeight:29 }, sectionSubtitle:{ color:'#777269', fontSize:10, marginTop:2 },
  cards:{ backgroundColor:'#FCFAF5', gap:8, paddingBottom:24, paddingHorizontal:18 },
  card:{ backgroundColor:'#fff', borderColor:'#DDD7CB', borderRadius:4, borderWidth:1, flexDirection:'row', height:106, overflow:'hidden' },
  cardImage:{ height:106, width:'44%' }, cardCopy:{ flex:1, justifyContent:'center', paddingHorizontal:13, position:'relative' },
  cardNumber:{ color:'#B18A36', fontSize:9, fontWeight:'800', letterSpacing:.8, marginBottom:4 }, cardTitle:{ color:'#24241F', fontFamily:'serif', fontSize:14, lineHeight:16, paddingRight:18 }, cardDescription:{ color:'#68645C', fontSize:8, lineHeight:11, marginTop:4, paddingRight:12 }, cardArrow:{ bottom:8, color:'#A47E2B', fontSize:17, position:'absolute', right:9 },
  mattersHeader:{ backgroundColor:'#EEE8DC', paddingHorizontal:18, paddingBottom:15, paddingTop:25 }, mattersTitle:{ color:'#22231F', fontFamily:'serif', fontSize:25, lineHeight:29 },
  matters:{ backgroundColor:'#EEE8DC', paddingBottom:25, paddingHorizontal:18 }, matterRow:{ borderTopColor:'#D0C7B7', borderTopWidth:1, flexDirection:'row', gap:13, paddingVertical:15 }, iconCircle:{ alignItems:'center', borderColor:'#A47E2B', borderRadius:18, borderWidth:1, height:35, justifyContent:'center', width:35 }, icon:{ color:'#9B762A', fontSize:17 }, matterCopy:{ flex:1 }, matterTitle:{ color:'#282823', fontFamily:'serif', fontSize:16, lineHeight:20, marginBottom:4 }, matterText:{ color:'#656159', fontSize:10, lineHeight:15 },
});
