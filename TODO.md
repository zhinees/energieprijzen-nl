# To do

## Duurzaamheid en andere verschillen buiten de prijs

Nu vergelijkt het project alleen wat een leverancier rekent. Contracten verschillen ook op andere punten. Die willen we per leverancier vastleggen in `kenmerken`, met bron en controledatum, net als de tarieven.

- **Duurzaamheid**
  - Herkomst van de stroom volgens het stroometiket: Nederlandse wind en zon, Europese GvO's of grijs.
  - Gas: grijs, CO₂-gecompenseerd of groen gas.
  - Budget Thuis biedt bij Independer een tweede, duurzamer dynamisch contract aan. In de eigen rekentool van Budget (propositie `Budget Energie Dynamisch`, `isGreenProposition: false`) staat het niet. Uitzoeken hoe het heet en of Budget het zelf publiceert. Zo ja, als apart bestand toevoegen.
- **Prijsinterval stroom**: per kwartier, per uur of zelf te kiezen.
- **Zonnepanelen**
  - Mag dynamisch met eigen opwek? Zonopnaam zet het contract bij teruglevering om naar variabel.
  - Slim terugleveren of automatisch afschakelen bij negatieve prijzen (`automatischAfschakelen` staat nu bijna overal op `null`).
- **Sturing en apps**: thuisbatterij, laadpaal of warmtepomp koppelen, en een app met prijzen.
- **Contract**
  - Opzegtermijn.
  - Alleen stroom mogelijk.
  - Combinatie van dynamische stroom met vast gas.
  - Welkomstkorting (eenmalig, zit niet in de tarieven).
- **Betalen**: vast voorschot, maandelijks herberekend voorschot of achteraf.

## Leveranciers

- **Mega**: de gastarieven (vaste kosten en opslag) ontbreken nog. De stroomwaarden zijn met de hand gelezen in de rekentool, want die zit achter een botcontrole. Ze moeten dus met de hand bijgehouden worden; de bot bewaakt de openbare pagina's en de productvoorwaarden van Mega en opent een issue als daar iets verandert. Een tariefwijziging die alleen in de rekentool zichtbaar is, ziet de bewaking niet.
- **Zonopnaam**: de adapter (`src/rekentools/zonopnaam.ts`) leest het tarievenblad van de lopende maand. Op 2026-09-30 gaf www.zonopnaam.nl vanuit de ontwikkelomgeving een 503/TLS-fout; bij de eerste run van de bot (1 oktober) controleren of het ophalen daar werkt.

## Vaste contracten (modelcontract 1 jaar vast)

Nog niet opgenomen, omdat de tarieven niet controleerbaar op de eigen site staan (gezocht op 2026-10-09):

- **Greenchoice**: biedt een vast modelcontract aan, maar publiceert alleen het tariefblad van het variabele modelcontract.
- **Mega**: het tariefblad zegt niet of het om het vaste of variabele modelcontract gaat, is van 1 januari 2026 en staat op Amazon S3 (niet op mega.nl). De rekentool zit achter een botcontrole.
- **United Consumers**: op de eigen site alleen een variabel modelcontract, zonder tarieven.
- **Gulf Gas & Power**: het tariefblad vast is van 1 april 2026 en staat op Amazon S3, niet op gulfgasandpower.nl.
- **Huismerk Energie**: de site was niet bereikbaar.
- **Zonneplan**: de terugleverkosten (€ 0) staan alleen in de bevestigingsbrief op Amazon S3; daarom ontbreken ze.
