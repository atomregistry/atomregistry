
(() => {
  "use strict";

  const STORAGE_KEY = "atomRegistryLanguage";

  const LANGUAGE_META = {
    en: { code: "EN", flag: "🇬🇧", htmlLang: "en" },
    de: { code: "DE", flag: "🇩🇪", htmlLang: "de" },
    es: { code: "ES", flag: "🇪🇸", htmlLang: "es" },
    pl: { code: "PL", flag: "🇵🇱", htmlLang: "pl" },
    pt: { code: "PT", flag: "🇵🇹", htmlLang: "pt" },
  };

  const EN = {
    "Atom Registry | Multi-TLD Web3 DNS on Cosmos Hub": {
      de: "Atom Registry | Multi-TLD Web3-DNS auf Cosmos Hub",
      es: "Atom Registry | DNS Web3 multi-TLD en Cosmos Hub",
      pl: "Atom Registry | Wielo-TLD Web3 DNS na Cosmos Hub",
      pt: "Atom Registry | DNS Web3 multi-TLD no Cosmos Hub",
    },
    "Register domains across multiple TLDs on Cosmos Hub. Forever ownership, no renewals, fully decentralized.": {
      de: "Registriere Domains über mehrere TLDs auf Cosmos Hub. Dauerhaftes Eigentum, keine Verlängerungen, vollständig dezentral.",
      es: "Registra dominios en múltiples TLDs en Cosmos Hub. Propiedad permanente, sin renovaciones, totalmente descentralizado.",
      pl: "Rejestruj domeny w wielu TLD na Cosmos Hub. Własność na zawsze, bez odnowień, w pełni zdecentralizowane.",
      pt: "Registre domínios em várias TLDs no Cosmos Hub. Propriedade permanente, sem renovações, totalmente descentralizado.",
    },

    "Home": { de: "Start", es: "Inicio", pl: "Start", pt: "Início" },
    "Search": { de: "Suche", es: "Buscar", pl: "Szukaj", pt: "Buscar" },
    "TLDs": { de: "TLDs", es: "TLDs", pl: "TLD", pt: "TLDs" },
    "Marketplaces": { de: "Marktplätze", es: "Mercados", pl: "Rynki", pt: "Mercados" },
    "Extension": { de: "Erweiterung", es: "Extensión", pl: "Rozszerzenie", pt: "Extensão" },

    "Connect Wallet": { de: "Wallet verbinden", es: "Conectar wallet", pl: "Połącz portfel", pt: "Conectar carteira" },
    "Connected wallet": { de: "Verbundenes Wallet", es: "Wallet conectada", pl: "Połączony portfel", pt: "Carteira conectada" },
    "Address": { de: "Adresse", es: "Dirección", pl: "Adres", pt: "Endereço" },
    "Balance": { de: "Guthaben", es: "Saldo", pl: "Saldo", pt: "Saldo" },
    "Last purchase TX": { de: "Letzte Kauf-TX", es: "Última TX de compra", pl: "Ostatnia transakcja zakupu", pt: "Última TX de compra" },
    "My Domains": { de: "Meine Domains", es: "Mis dominios", pl: "Moje domeny", pt: "Meus domínios" },
    "TLD Settings": { de: "TLD-Einstellungen", es: "Ajustes de TLD", pl: "Ustawienia TLD", pt: "Configurações de TLD" },
    "Metadata": { de: "Metadaten", es: "Metadatos", pl: "Metadane", pt: "Metadados" },
    "dSSL": { de: "dSSL", es: "dSSL", pl: "dSSL", pt: "dSSL" },
    "View on Mintscan": { de: "Auf Mintscan ansehen", es: "Ver en Mintscan", pl: "Zobacz na Mintscan", pt: "Ver no Mintscan" },
    "Switch wallet": { de: "Wallet wechseln", es: "Cambiar wallet", pl: "Zmień portfel", pt: "Trocar carteira" },
    "Disconnect": { de: "Trennen", es: "Desconectar", pl: "Rozłącz", pt: "Desconectar" },

    "Language selector": { de: "Sprachauswahl", es: "Selector de idioma", pl: "Wybór języka", pt: "Seletor de idioma" },
    "Choose TLD": { de: "TLD wählen", es: "Elegir TLD", pl: "Wybierz TLD", pt: "Escolher TLD" },
    "Choose purchase type": { de: "Kaufart wählen", es: "Elegir tipo de compra", pl: "Wybierz typ zakupu", pt: "Escolher tipo de compra" },
    "Domain and TLD availability search": { de: "Domain- und TLD-Verfügbarkeitssuche", es: "Búsqueda de disponibilidad de dominio y TLD", pl: "Wyszukiwanie dostępności domen i TLD", pt: "Busca de disponibilidade de domínio e TLD" },
    "Wallet menu": { de: "Wallet-Menü", es: "Menú de wallet", pl: "Menu portfela", pt: "Menu da carteira" },
    "Copy wallet address": { de: "Wallet-Adresse kopieren", es: "Copiar dirección de wallet", pl: "Kopiuj adres portfela", pt: "Copiar endereço da carteira" },
    "Copy address": { de: "Adresse kopieren", es: "Copiar dirección", pl: "Kopiuj adres", pt: "Copiar endereço" },

    "Atom Registry - Multi-TLD Web3 DNS on Cosmos Hub": {
      de: "Atom Registry - Multi-TLD Web3-DNS auf Cosmos Hub",
      es: "Atom Registry - DNS Web3 multi-TLD en Cosmos Hub",
      pl: "Atom Registry - Wielo-TLD Web3 DNS na Cosmos Hub",
      pt: "Atom Registry - DNS Web3 multi-TLD no Cosmos Hub",
    },
    "Forever Ownership - No Renewals Ever": {
      de: "Dauerhaftes Eigentum - Nie wieder Verlängerungen",
      es: "Propiedad permanente - Sin renovaciones",
      pl: "Własność na zawsze - Bez żadnych odnowień",
      pt: "Propriedade permanente - Sem renovações",
    },
    "TLD Pricing - Dynamic Rates by Length": {
      de: "TLD-Preise - Dynamische Raten nach Länge",
      es: "Precios de TLD - Tarifas dinámicas por longitud",
      pl: "Ceny TLD - Dynamiczne stawki według długości",
      pt: "Preços de TLD - Tarifas dinâmicas por comprimento",
    },
    "TLD Owners Earn on Every Name Registered": {
      de: "TLD-Besitzer verdienen an jeder registrierten Domain",
      es: "Los propietarios de TLD ganan por cada nombre registrado",
      pl: "Właściciele TLD zarabiają na każdej rejestracji nazwy",
      pt: "Donos de TLD ganham em cada nome registrado",
    },
    "v2 Coming Soon - Revenue Sharing + DNS Layer": {
      de: "v2 kommt bald - Umsatzbeteiligung + DNS-Schicht",
      es: "v2 próximamente - Reparto de ingresos + capa DNS",
      pl: "v2 już wkrótce - Podział przychodów + warstwa DNS",
      pt: "v2 em breve - Compartilhamento de receita + camada DNS",
    },

    "Web3 domains on Cosmos Hub": {
      de: "Web3-Domains auf Cosmos Hub",
      es: "Dominios Web3 en Cosmos Hub",
      pl: "Domeny Web3 na Cosmos Hub",
      pt: "Domínios Web3 no Cosmos Hub",
    },
    "Own your Web3 domain forever.": {
      de: "Besitze deine Web3-Domain für immer.",
      es: "Posee tu dominio Web3 para siempre.",
      pl: "Posiadaj swoją domenę Web3 na zawsze.",
      pt: "Tenha seu domínio Web3 para sempre.",
    },
    "Own your": { de: "Besitze deine", es: "Posee tu", pl: "Posiadaj swoją", pt: "Tenha seu" },
    "Web3 domain": { de: "Web3-Domain", es: "dominio Web3", pl: "domenę Web3", pt: "domínio Web3" },
    "forever.": { de: "für immer.", es: "para siempre.", pl: "na zawsze.", pt: "para sempre." },
    "Register names on Cosmos Hub with permanent ownership, wallet-native management and no renewal fees. Search a name, connect your wallet, and claim it on-chain in minutes.": {
      de: "Registriere Namen auf Cosmos Hub mit dauerhaftem Eigentum, Wallet-nativer Verwaltung und ohne Verlängerungsgebühren. Suche einen Namen, verbinde dein Wallet und sichere ihn dir in Minuten on-chain.",
      es: "Registra nombres en Cosmos Hub con propiedad permanente, gestión nativa desde wallet y sin tarifas de renovación. Busca un nombre, conecta tu wallet y reclámalo on-chain en minutos.",
      pl: "Rejestruj nazwy na Cosmos Hub z trwałą własnością, zarządzaniem przez portfel i bez opłat za odnowienie. Wyszukaj nazwę, połącz portfel i odbierz ją on-chain w kilka minut.",
      pt: "Registre nomes no Cosmos Hub com propriedade permanente, gestão nativa por carteira e sem taxas de renovação. Pesquise um nome, conecte sua carteira e reivindique on-chain em minutos.",
    },
    "Pay once": { de: "Einmal zahlen", es: "Paga una vez", pl: "Płać raz", pt: "Pague uma vez" },
    "No renewals": { de: "Keine Verlängerungen", es: "Sin renovaciones", pl: "Bez odnowień", pt: "Sem renovações" },
    "Transfer anytime": { de: "Jederzeit übertragen", es: "Transfiere cuando quieras", pl: "Przenieś w dowolnym momencie", pt: "Transfira a qualquer momento" },
    "Fully on-chain": { de: "Vollständig on-chain", es: "Totalmente on-chain", pl: "W pełni on-chain", pt: "Totalmente on-chain" },
    "Cosmos Hub": { de: "Cosmos Hub", es: "Cosmos Hub", pl: "Cosmos Hub", pt: "Cosmos Hub" },
    "Secured by public chain ownership": {
      de: "Gesichert durch öffentliches Chain-Eigentum",
      es: "Protegido por propiedad en cadena pública",
      pl: "Zabezpieczone publiczną własnością on-chain",
      pt: "Protegido por propriedade em cadeia pública",
    },
    "Wallet native": { de: "Wallet-nativ", es: "Nativo de wallet", pl: "Natywne dla portfela", pt: "Nativo da carteira" },
    "Keplr, Cosmostation, Ledger, Keystone": { de: "Keplr, Cosmostation, Ledger, Keystone", es: "Keplr, Cosmostation, Ledger, Keystone", pl: "Keplr, Cosmostation, Ledger, Keystone", pt: "Keplr, Cosmostation, Ledger, Keystone" },
    "TLD economy": { de: "TLD-Ökonomie", es: "Economía TLD", pl: "Ekonomia TLD", pt: "Economia TLD" },
    "Own namespaces and earn from names": {
      de: "Besitze Namespaces und verdiene an Namen",
      es: "Posee espacios de nombres y gana con nombres",
      pl: "Posiadaj przestrzenie nazw i zarabiaj na nazwach",
      pt: "Possua namespaces e ganhe com nomes",
    },

    "Find your domain": { de: "Finde deine Domain", es: "Encuentra tu dominio", pl: "Znajdź swoją domenę", pt: "Encontre seu domínio" },
    "Buy a name under an existing TLD, like yourname.atom. Switch to TLD if you want to own the whole namespace.": {
      de: "Kaufe einen Namen unter einer bestehenden TLD, z. B. yourname.atom. Wechsle zu TLD, wenn du den gesamten Namespace besitzen möchtest.",
      es: "Compra un nombre bajo una TLD existente, como yourname.atom. Cambia a TLD si quieres poseer todo el namespace.",
      pl: "Kup nazwę pod istniejącą TLD, np. yourname.atom. Przełącz na TLD, jeśli chcesz posiadać całą przestrzeń nazw.",
      pt: "Compre um nome sob uma TLD existente, como yourname.atom. Mude para TLD se quiser possuir todo o namespace.",
    },
    "Domain name": { de: "Domainname", es: "Nombre de dominio", pl: "Nazwa domeny", pt: "Nome de domínio" },
    "Whole .TLD": { de: "Ganze .TLD", es: "Toda la .TLD", pl: "Całe .TLD", pt: "Toda a .TLD" },
    "yourname": { de: "deinname", es: "tunombre", pl: "twojanazwa", pt: "seunome" },
    "Check availability": { de: "Verfügbarkeit prüfen", es: "Comprobar disponibilidad", pl: "Sprawdź dostępność", pt: "Verificar disponibilidade" },
    "No hidden renewals. Your wallet stays in control.": {
      de: "Keine versteckten Verlängerungen. Dein Wallet behält die Kontrolle.",
      es: "Sin renovaciones ocultas. Tu wallet mantiene el control.",
      pl: "Bez ukrytych odnowień. Twój portfel zachowuje kontrolę.",
      pt: "Sem renovações ocultas. Sua carteira mantém o controle.",
    },
    "Ownership": { de: "Eigentum", es: "Propiedad", pl: "Własność", pt: "Propriedade" },
    "Forever": { de: "Für immer", es: "Para siempre", pl: "Na zawsze", pt: "Para sempre" },
    "Payment": { de: "Zahlung", es: "Pago", pl: "Płatność", pt: "Pagamento" },
    "ATOM": { de: "ATOM", es: "ATOM", pl: "ATOM", pt: "ATOM" },
    "Records": { de: "Einträge", es: "Registros", pl: "Rekordy", pt: "Registros" },
    "On-chain": { de: "On-chain", es: "On-chain", pl: "On-chain", pt: "On-chain" },
    "Own namespace": { de: "Namespace besitzen", es: "Posee el namespace", pl: "Posiadaj przestrzeń nazw", pt: "Possua o namespace" },
    "Claim .hero, .dao, .club or any available TLD.": {
      de: "Sichere dir .hero, .dao, .club oder jede verfügbare TLD.",
      es: "Reclama .hero, .dao, .club o cualquier TLD disponible.",
      pl: "Zarejestruj .hero, .dao, .club albo dowolną dostępną TLD.",
      pt: "Reivindique .hero, .dao, .club ou qualquer TLD disponível.",
    },
    "Set rules": { de: "Regeln festlegen", es: "Define reglas", pl: "Ustaw zasady", pt: "Defina regras" },
    "Control pricing and registration policy for names under it.": {
      de: "Steuere Preise und Registrierungsregeln für Namen darunter.",
      es: "Controla precios y política de registro para nombres bajo ella.",
      pl: "Kontroluj ceny i zasady rejestracji nazw pod nią.",
      pt: "Controle preços e política de registro para nomes abaixo dela.",
    },
    "Earn fees": { de: "Gebühren verdienen", es: "Gana comisiones", pl: "Zarabiaj opłaty", pt: "Ganhe taxas" },
    "Collect registration revenue from your namespace.": {
      de: "Sammle Registrierungserlöse aus deinem Namespace.",
      es: "Recibe ingresos por registros de tu namespace.",
      pl: "Pobieraj przychody z rejestracji w swojej przestrzeni nazw.",
      pt: "Receba receita de registros do seu namespace.",
    },
    "Tip:": { de: "Tipp:", es: "Consejo:", pl: "Wskazówka:", pt: "Dica:" },
    "Use Domain name for yourname.atom. Use Whole .TLD to register .yourbrand itself.": {
      de: "Nutze Domainname für yourname.atom. Nutze Ganze .TLD, um .yourbrand selbst zu registrieren.",
      es: "Usa Nombre de dominio para yourname.atom. Usa Toda la .TLD para registrar .yourbrand.",
      pl: "Użyj Nazwa domeny dla yourname.atom. Użyj Całe .TLD, aby zarejestrować samo .yourbrand.",
      pt: "Use Nome de domínio para yourname.atom. Use Toda a .TLD para registrar o próprio .yourbrand.",
    },

    "Why Atom Registry": { de: "Warum Atom Registry", es: "Por qué Atom Registry", pl: "Dlaczego Atom Registry", pt: "Por que Atom Registry" },
    "Permanent names on Cosmos Hub.": {
      de: "Dauerhafte Namen auf Cosmos Hub.",
      es: "Nombres permanentes en Cosmos Hub.",
      pl: "Stałe nazwy na Cosmos Hub.",
      pt: "Nomes permanentes no Cosmos Hub.",
    },
    "Own domains, launch TLD namespaces, publish resolver records and control identity directly from your wallet. No renewals, no custodial accounts, no rented names pretending to be ownership.": {
      de: "Besitze Domains, starte TLD-Namespaces, veröffentliche Resolver-Einträge und kontrolliere deine Identität direkt aus deinem Wallet. Keine Verlängerungen, keine Custody-Konten, keine gemieteten Namen, die Eigentum vortäuschen.",
      es: "Posee dominios, lanza namespaces TLD, publica registros de resolución y controla tu identidad directamente desde tu wallet. Sin renovaciones, sin cuentas custodiales, sin nombres alquilados fingiendo ser propiedad.",
      pl: "Posiadaj domeny, uruchamiaj przestrzenie TLD, publikuj rekordy resolvera i kontroluj tożsamość bezpośrednio z portfela. Bez odnowień, bez kont powierniczych, bez wynajętych nazw udających własność.",
      pt: "Possua domínios, lance namespaces TLD, publique registros de resolução e controle sua identidade diretamente pela carteira. Sem renovações, sem contas custodiais, sem nomes alugados fingindo ser propriedade.",
    },
    "Atom Registry global on-chain ownership map": {
      de: "Globale On-chain-Eigentumskarte von Atom Registry",
      es: "Mapa global de propiedad on-chain de Atom Registry",
      pl: "Globalna mapa własności on-chain Atom Registry",
      pt: "Mapa global de propriedade on-chain da Atom Registry",
    },
    "Cosmos Hub native naming": { de: "Cosmos Hub-natives Naming", es: "Nombres nativos de Cosmos Hub", pl: "Natywne nazwy Cosmos Hub", pt: "Nomes nativos do Cosmos Hub" },
    "On-chain ownership": { de: "On-chain-Eigentum", es: "Propiedad on-chain", pl: "Własność on-chain", pt: "Propriedade on-chain" },
    "Names and TLDs secured by public chain state.": {
      de: "Namen und TLDs sind durch öffentlichen Chain-State gesichert.",
      es: "Nombres y TLDs protegidos por el estado de cadena pública.",
      pl: "Nazwy i TLD zabezpieczone publicznym stanem blockchaina.",
      pt: "Nomes e TLDs protegidos pelo estado público da blockchain.",
    },
    "Pay once and keep control from your wallet.": {
      de: "Einmal zahlen und die Kontrolle im Wallet behalten.",
      es: "Paga una vez y conserva el control desde tu wallet.",
      pl: "Zapłać raz i zachowaj kontrolę z portfela.",
      pt: "Pague uma vez e mantenha o controle pela carteira.",
    },
    "Resolver layer": { de: "Resolver-Schicht", es: "Capa de resolución", pl: "Warstwa resolvera", pt: "Camada de resolução" },
    "DNS records, websites and identity metadata.": {
      de: "DNS-Einträge, Websites und Identitätsmetadaten.",
      es: "Registros DNS, sitios web y metadatos de identidad.",
      pl: "Rekordy DNS, strony internetowe i metadane tożsamości.",
      pt: "Registros DNS, sites e metadados de identidade.",
    },
    "Launch namespaces and earn from registrations.": {
      de: "Starte Namespaces und verdiene an Registrierungen.",
      es: "Lanza namespaces y gana con registros.",
      pl: "Uruchamiaj przestrzenie nazw i zarabiaj na rejestracjach.",
      pt: "Lance namespaces e ganhe com registros.",
    },

    "Pay once and keep ownership without recurring expiry games.": {
      de: "Einmal zahlen und Eigentum behalten, ohne wiederkehrende Ablaufspielchen.",
      es: "Paga una vez y conserva la propiedad sin juegos de caducidad recurrentes.",
      pl: "Zapłać raz i zachowaj własność bez cyklicznych zabaw w wygasanie.",
      pt: "Pague uma vez e mantenha a propriedade sem jogos recorrentes de expiração.",
    },
    "On-chain proof": { de: "On-chain-Nachweis", es: "Prueba on-chain", pl: "Dowód on-chain", pt: "Prova on-chain" },
    "Ownership is stored on Cosmos Hub and verifiable on Mintscan.": {
      de: "Eigentum wird auf Cosmos Hub gespeichert und ist auf Mintscan prüfbar.",
      es: "La propiedad se almacena en Cosmos Hub y se puede verificar en Mintscan.",
      pl: "Własność jest zapisana na Cosmos Hub i możliwa do weryfikacji na Mintscan.",
      pt: "A propriedade é armazenada no Cosmos Hub e verificável no Mintscan.",
    },
    "Wallet control": { de: "Wallet-Kontrolle", es: "Control por wallet", pl: "Kontrola z portfela", pt: "Controle pela carteira" },
    "Manage names directly from your own wallet, not a custodial account.": {
      de: "Verwalte Namen direkt aus deinem eigenen Wallet, nicht aus einem Custody-Konto.",
      es: "Gestiona nombres directamente desde tu propia wallet, no desde una cuenta custodial.",
      pl: "Zarządzaj nazwami bezpośrednio ze swojego portfela, nie z konta powierniczego.",
      pt: "Gerencie nomes diretamente da sua própria carteira, não de uma conta custodial.",
    },
    "Own a TLD": { de: "Besitze eine TLD", es: "Posee una TLD", pl: "Posiadaj TLD", pt: "Possua uma TLD" },
    "Register a top-level namespace and earn from registrations under it.": {
      de: "Registriere einen Top-Level-Namespace und verdiene an Registrierungen darunter.",
      es: "Registra un namespace de nivel superior y gana con registros bajo él.",
      pl: "Zarejestruj przestrzeń najwyższego poziomu i zarabiaj na rejestracjach pod nią.",
      pt: "Registre um namespace de nível superior e ganhe com registros abaixo dele.",
    },

    "Register under an active TLD": {
      de: "Unter einer aktiven TLD registrieren",
      es: "Registrar bajo una TLD activa",
      pl: "Rejestruj pod aktywną TLD",
      pt: "Registrar sob uma TLD ativa",
    },
    "This is the normal domain purchase flow. Choose an existing namespace, enter your label, check availability, then register it from your wallet.": {
      de: "Das ist der normale Domain-Kauffluss. Wähle einen bestehenden Namespace, gib dein Label ein, prüfe die Verfügbarkeit und registriere es aus deinem Wallet.",
      es: "Este es el flujo normal de compra de dominios. Elige un namespace existente, introduce tu etiqueta, comprueba la disponibilidad y regístralo desde tu wallet.",
      pl: "To zwykły proces zakupu domeny. Wybierz istniejącą przestrzeń nazw, wpisz etykietę, sprawdź dostępność i zarejestruj ją z portfela.",
      pt: "Este é o fluxo normal de compra de domínio. Escolha um namespace existente, insira seu rótulo, verifique a disponibilidade e registre pela carteira.",
    },
    "Example:": { de: "Beispiel:", es: "Ejemplo:", pl: "Przykład:", pt: "Exemplo:" },
    "The one-time payment goes to the TLD owner according to their policy.": {
      de: "Die Einmalzahlung geht gemäß Richtlinie an den TLD-Besitzer.",
      es: "El pago único va al propietario de la TLD según su política.",
      pl: "Jednorazowa płatność trafia do właściciela TLD zgodnie z jego polityką.",
      pt: "O pagamento único vai para o dono da TLD conforme a política dele.",
    },
    "After registration, the name appears in your portfolio and can be managed or transferred.": {
      de: "Nach der Registrierung erscheint der Name in deinem Portfolio und kann verwaltet oder übertragen werden.",
      es: "Tras el registro, el nombre aparece en tu portfolio y puede gestionarse o transferirse.",
      pl: "Po rejestracji nazwa pojawia się w portfolio i może być zarządzana lub przeniesiona.",
      pt: "Após o registro, o nome aparece no seu portfólio e pode ser gerenciado ou transferido.",
    },
    "Top-level domain": { de: "Top-Level-Domain", es: "Dominio de nivel superior", pl: "Domena najwyższego poziomu", pt: "Domínio de nível superior" },
    "Own the whole .TLD": { de: "Besitze die ganze .TLD", es: "Posee toda la .TLD", pl: "Posiadaj całe .TLD", pt: "Possua toda a .TLD" },
    "A TLD is the namespace itself. Registering .yourbrand lets you control registrations under it and set the price for names like shop.yourbrand.": {
      de: "Eine TLD ist der Namespace selbst. Wenn du .yourbrand registrierst, kontrollierst du Registrierungen darunter und legst Preise für Namen wie shop.yourbrand fest.",
      es: "Una TLD es el propio namespace. Registrar .yourbrand te permite controlar registros bajo ella y fijar el precio de nombres como shop.yourbrand.",
      pl: "TLD to sama przestrzeń nazw. Rejestracja .yourbrand pozwala kontrolować rejestracje pod nią i ustawiać cenę nazw takich jak shop.yourbrand.",
      pt: "Uma TLD é o próprio namespace. Registrar .yourbrand permite controlar registros abaixo dela e definir o preço de nomes como shop.yourbrand.",
    },
    "Best for brands, DAOs, communities, apps and creators.": {
      de: "Ideal für Marken, DAOs, Communities, Apps und Creator.",
      es: "Ideal para marcas, DAOs, comunidades, apps y creadores.",
      pl: "Najlepsze dla marek, DAO, społeczności, aplikacji i twórców.",
      pt: "Ideal para marcas, DAOs, comunidades, apps e criadores.",
    },
    "You can enable or pause public subdomain registration.": {
      de: "Du kannst öffentliche Subdomain-Registrierung aktivieren oder pausieren.",
      es: "Puedes activar o pausar el registro público de subdominios.",
      pl: "Możesz włączyć lub wstrzymać publiczną rejestrację subdomen.",
      pt: "Você pode ativar ou pausar o registro público de subdomínios.",
    },
    "Explore TLD ownership": { de: "TLD-Eigentum erkunden", es: "Explorar propiedad TLD", pl: "Poznaj własność TLD", pt: "Explorar propriedade TLD" },
    "Public namespaces": { de: "Öffentliche Namespaces", es: "Namespaces públicos", pl: "Publiczne przestrzenie nazw", pt: "Namespaces públicos" },
    "Find a name under an open TLD": {
      de: "Finde einen Namen unter einer offenen TLD",
      es: "Encuentra un nombre bajo una TLD abierta",
      pl: "Znajdź nazwę pod otwartą TLD",
      pt: "Encontre um nome sob uma TLD aberta",
    },
    "Choose a public namespace, type your label, then check availability. The list below is still loaded from on-chain TLD policies, just without turning the layout into a tag soup.": {
      de: "Wähle einen öffentlichen Namespace, tippe dein Label ein und prüfe die Verfügbarkeit. Die Liste unten wird weiterhin aus On-chain-TLD-Richtlinien geladen, nur ohne das Layout in Tagsuppe zu verwandeln.",
      es: "Elige un namespace público, escribe tu etiqueta y comprueba la disponibilidad. La lista inferior sigue cargándose desde políticas TLD on-chain, solo sin convertir el diseño en sopa de etiquetas.",
      pl: "Wybierz publiczną przestrzeń nazw, wpisz swoją etykietę i sprawdź dostępność. Lista poniżej nadal ładuje się z polityk TLD on-chain, tylko bez zamieniania układu w zupę tagów.",
      pt: "Escolha um namespace público, digite seu rótulo e verifique a disponibilidade. A lista abaixo ainda é carregada das políticas TLD on-chain, só sem transformar o layout em sopa de tags.",
    },
    "Refresh": { de: "Aktualisieren", es: "Actualizar", pl: "Odśwież", pt: "Atualizar" },
    "Loading public TLD policies...": {
      de: "Öffentliche TLD-Richtlinien werden geladen...",
      es: "Cargando políticas públicas de TLD...",
      pl: "Ładowanie publicznych polityk TLD...",
      pt: "Carregando políticas públicas de TLD...",
    },
    "Showing public TLDs with active registration policy. Select one to unlock the name checker.": {
      de: "Zeigt öffentliche TLDs mit aktiver Registrierungsrichtlinie. Wähle eine, um den Namenprüfer freizuschalten.",
      es: "Mostrando TLDs públicas con política de registro activa. Selecciona una para desbloquear el comprobador.",
      pl: "Pokazuje publiczne TLD z aktywną polityką rejestracji. Wybierz jedną, aby odblokować sprawdzanie nazw.",
      pt: "Mostrando TLDs públicas com política de registro ativa. Selecione uma para liberar o verificador.",
    },
    "Search name": { de: "Namen suchen", es: "Buscar nombre", pl: "Szukaj nazwy", pt: "Buscar nome" },
    "Selected TLD": { de: "Gewählte TLD", es: "TLD seleccionada", pl: "Wybrana TLD", pt: "TLD selecionada" },
    "Price": { de: "Preis", es: "Precio", pl: "Cena", pt: "Preço" },
    "Owner": { de: "Besitzer", es: "Propietario", pl: "Właściciel", pt: "Dono" },
    "Check": { de: "Prüfen", es: "Comprobar", pl: "Sprawdź", pt: "Verificar" },
    "Buying flow": { de: "Kaufablauf", es: "Flujo de compra", pl: "Proces zakupu", pt: "Fluxo de compra" },
    "How domain buying works": {
      de: "Wie der Domainkauf funktioniert",
      es: "Cómo funciona la compra de dominios",
      pl: "Jak działa kupowanie domen",
      pt: "Como funciona a compra de domínios",
    },
    "Domain registration is separate from TLD ownership. One buys a name under a namespace; the other buys the namespace itself.": {
      de: "Domainregistrierung ist getrennt vom TLD-Eigentum. Das eine kauft einen Namen unter einem Namespace, das andere den Namespace selbst.",
      es: "El registro de dominio es distinto de la propiedad de una TLD. Uno compra un nombre bajo un namespace; lo otro compra el namespace en sí.",
      pl: "Rejestracja domeny jest oddzielna od własności TLD. Jedno kupuje nazwę pod przestrzenią nazw, drugie kupuje samą przestrzeń nazw.",
      pt: "O registro de domínio é separado da propriedade de TLD. Um compra um nome sob um namespace; o outro compra o próprio namespace.",
    },
    "Select .atom, .web3, .dao or another public namespace.": {
      de: "Wähle .atom, .web3, .dao oder einen anderen öffentlichen Namespace.",
      es: "Selecciona .atom, .web3, .dao u otro namespace público.",
      pl: "Wybierz .atom, .web3, .dao albo inną publiczną przestrzeń nazw.",
      pt: "Selecione .atom, .web3, .dao ou outro namespace público.",
    },
    "Check if your label is available under that TLD.": {
      de: "Prüfe, ob dein Label unter dieser TLD verfügbar ist.",
      es: "Comprueba si tu etiqueta está disponible bajo esa TLD.",
      pl: "Sprawdź, czy Twoja etykieta jest dostępna pod tą TLD.",
      pt: "Verifique se seu rótulo está disponível sob essa TLD.",
    },
    "Register on-chain": { de: "On-chain registrieren", es: "Registrar on-chain", pl: "Zarejestruj on-chain", pt: "Registrar on-chain" },
    "Pay once with your wallet and keep ownership without renewals.": {
      de: "Zahle einmal mit deinem Wallet und behalte Eigentum ohne Verlängerungen.",
      es: "Paga una vez con tu wallet y conserva la propiedad sin renovaciones.",
      pl: "Zapłać raz portfelem i zachowaj własność bez odnowień.",
      pt: "Pague uma vez com sua carteira e mantenha a propriedade sem renovações.",
    },
    "I want my own .TLD": { de: "Ich will meine eigene .TLD", es: "Quiero mi propia .TLD", pl: "Chcę własne .TLD", pt: "Quero minha própria .TLD" },

    "Your Portfolio": { de: "Dein Portfolio", es: "Tu portfolio", pl: "Twoje portfolio", pt: "Seu portfólio" },
    "All names and TLDs you own across the registry": {
      de: "Alle Namen und TLDs, die du in der Registry besitzt",
      es: "Todos los nombres y TLDs que posees en el registro",
      pl: "Wszystkie nazwy i TLD, które posiadasz w rejestrze",
      pt: "Todos os nomes e TLDs que você possui no registro",
    },
    "Sync": { de: "Synchronisieren", es: "Sincronizar", pl: "Synchronizuj", pt: "Sincronizar" },
    "Total Names": { de: "Namen insgesamt", es: "Nombres totales", pl: "Łącznie nazw", pt: "Total de nomes" },
    "TLDs Owned": { de: "Besessene TLDs", es: "TLDs propias", pl: "Posiadane TLD", pt: "TLDs possuídas" },
    "Subdomains": { de: "Subdomains", es: "Subdominios", pl: "Subdomeny", pt: "Subdomínios" },
    "Primary Name": { de: "Primärer Name", es: "Nombre principal", pl: "Nazwa główna", pt: "Nome principal" },

    "Back to portfolio": { de: "Zurück zum Portfolio", es: "Volver al portfolio", pl: "Wróć do portfolio", pt: "Voltar ao portfólio" },
    "Manage domain": { de: "Domain verwalten", es: "Gestionar dominio", pl: "Zarządzaj domeną", pt: "Gerenciar domínio" },
    "Live on Cosmos Hub": { de: "Live auf Cosmos Hub", es: "Activo en Cosmos Hub", pl: "Aktywne na Cosmos Hub", pt: "Ativo no Cosmos Hub" },
    "Status": { de: "Status", es: "Estado", pl: "Status", pt: "Status" },
    "Active": { de: "Aktiv", es: "Activo", pl: "Aktywne", pt: "Ativo" },
    "Control": { de: "Kontrolle", es: "Control", pl: "Kontrola", pt: "Controle" },
    "Wallet": { de: "Wallet", es: "Wallet", pl: "Portfel", pt: "Carteira" },
    "Primary Identity": { de: "Primäre Identität", es: "Identidad principal", pl: "Tożsamość główna", pt: "Identidade principal" },
    "Use this name as your main public identity across Atom Registry.": {
      de: "Nutze diesen Namen als deine öffentliche Hauptidentität in Atom Registry.",
      es: "Usa este nombre como tu identidad pública principal en Atom Registry.",
      pl: "Użyj tej nazwy jako głównej publicznej tożsamości w Atom Registry.",
      pt: "Use este nome como sua identidade pública principal na Atom Registry.",
    },
    "Set as Primary": { de: "Als primär setzen", es: "Establecer como principal", pl: "Ustaw jako główną", pt: "Definir como principal" },
    "DNS Records": { de: "DNS-Einträge", es: "Registros DNS", pl: "Rekordy DNS", pt: "Registros DNS" },
    "Add resolver records for sites, apps, profiles or wallet metadata.": {
      de: "Füge Resolver-Einträge für Websites, Apps, Profile oder Wallet-Metadaten hinzu.",
      es: "Añade registros de resolución para sitios, apps, perfiles o metadatos de wallet.",
      pl: "Dodaj rekordy resolvera dla stron, aplikacji, profili lub metadanych portfela.",
      pt: "Adicione registros de resolução para sites, apps, perfis ou metadados da carteira.",
    },
    "IPv4 address": { de: "IPv4-Adresse", es: "Dirección IPv4", pl: "Adres IPv4", pt: "Endereço IPv4" },
    "IPv6 address": { de: "IPv6-Adresse", es: "Dirección IPv6", pl: "Adres IPv6", pt: "Endereço IPv6" },
    "Domain alias": { de: "Domain-Alias", es: "Alias de dominio", pl: "Alias domeny", pt: "Alias de domínio" },
    "Text metadata": { de: "Textmetadaten", es: "Metadatos de texto", pl: "Metadane tekstowe", pt: "Metadados de texto" },
    "Value, e.g. 1.2.3.4": { de: "Wert, z. B. 1.2.3.4", es: "Valor, p. ej. 1.2.3.4", pl: "Wartość, np. 1.2.3.4", pt: "Valor, ex. 1.2.3.4" },
    "Set Record": { de: "Eintrag setzen", es: "Guardar registro", pl: "Ustaw rekord", pt: "Definir registro" },
    "Uses Resolver contract:": { de: "Nutzt Resolver-Vertrag:", es: "Usa contrato Resolver:", pl: "Używa kontraktu Resolver:", pt: "Usa contrato Resolver:" },
    "Subdomain Policy": { de: "Subdomain-Richtlinie", es: "Política de subdominios", pl: "Polityka subdomen", pt: "Política de subdomínios" },
    "Control who can register names under your TLD and at what price.": {
      de: "Kontrolliere, wer Namen unter deiner TLD registrieren kann und zu welchem Preis.",
      es: "Controla quién puede registrar nombres bajo tu TLD y a qué precio.",
      pl: "Kontroluj, kto może rejestrować nazwy pod Twoją TLD i po jakiej cenie.",
      pt: "Controle quem pode registrar nomes sob sua TLD e por qual preço.",
    },
    "Pricing by name length": { de: "Preis nach Namenslänge", es: "Precio por longitud del nombre", pl: "Cena według długości nazwy", pt: "Preço por tamanho do nome" },
    "Set the registration price for each name length. Short, rare names can cost more; longer names can stay affordable. The 6+ chars row is used as the default public price.": {
      de: "Lege den Registrierungspreis für jede Namenslänge fest. Kurze, seltene Namen können mehr kosten; längere bleiben erschwinglich. Die Zeile 6+ Zeichen dient als öffentlicher Standardpreis.",
      es: "Define el precio de registro para cada longitud de nombre. Los nombres cortos y raros pueden costar más; los largos pueden seguir siendo asequibles. La fila de 6+ caracteres se usa como precio público predeterminado.",
      pl: "Ustaw cenę rejestracji dla każdej długości nazwy. Krótkie, rzadkie nazwy mogą kosztować więcej; dłuższe mogą pozostać przystępne. Wiersz 6+ znaków jest domyślną ceną publiczną.",
      pt: "Defina o preço de registro para cada tamanho de nome. Nomes curtos e raros podem custar mais; nomes longos podem continuar acessíveis. A linha de 6+ caracteres é usada como preço público padrão.",
    },
    "Revenue Settings": { de: "Einnahmeneinstellungen", es: "Ajustes de ingresos", pl: "Ustawienia przychodów", pt: "Configurações de receita" },
    "Choose where registration payments go and how many names one wallet can claim.": {
      de: "Wähle, wohin Registrierungszahlungen gehen und wie viele Namen ein Wallet beanspruchen kann.",
      es: "Elige dónde van los pagos de registro y cuántos nombres puede reclamar una wallet.",
      pl: "Wybierz, dokąd trafiają płatności za rejestrację i ile nazw może odebrać jeden portfel.",
      pt: "Escolha para onde vão os pagamentos de registro e quantos nomes uma carteira pode reivindicar.",
    },
    "Payment Recipient": { de: "Zahlungsempfänger", es: "Destinatario del pago", pl: "Odbiorca płatności", pt: "Destinatário do pagamento" },
    "Max Per Address": { de: "Max. pro Adresse", es: "Máx. por dirección", pl: "Maks. na adres", pt: "Máx. por endereço" },
    "TLD Visibility": { de: "TLD-Sichtbarkeit", es: "Visibilidad de TLD", pl: "Widoczność TLD", pt: "Visibilidade da TLD" },
    "Choose whether everyone can purchase SLDs on this TLD, or only you as the owner can.": {
      de: "Wähle, ob jeder SLDs auf dieser TLD kaufen kann oder nur du als Besitzer.",
      es: "Elige si todos pueden comprar SLDs en esta TLD o solo tú como propietario.",
      pl: "Wybierz, czy każdy może kupować SLD w tej TLD, czy tylko Ty jako właściciel.",
      pt: "Escolha se todos podem comprar SLDs nesta TLD ou só você como dono.",
    },
    "Registration status": { de: "Registrierungsstatus", es: "Estado de registro", pl: "Status rejestracji", pt: "Status de registro" },
    "Public": { de: "Öffentlich", es: "Público", pl: "Publiczne", pt: "Público" },
    "Private": { de: "Privat", es: "Privado", pl: "Prywatne", pt: "Privado" },
    "Public - Everyone can purchase SLDs on this TLD": {
      de: "Öffentlich - Jeder kann SLDs auf dieser TLD kaufen",
      es: "Público - Todos pueden comprar SLDs en esta TLD",
      pl: "Publiczne - Każdy może kupować SLD w tej TLD",
      pt: "Público - Todos podem comprar SLDs nesta TLD",
    },
    "Private - Only you, the owner, can purchase SLDs on this TLD": {
      de: "Privat - Nur du als Besitzer kannst SLDs auf dieser TLD kaufen",
      es: "Privado - Solo tú, el propietario, puedes comprar SLDs en esta TLD",
      pl: "Prywatne - Tylko Ty, właściciel, możesz kupować SLD w tej TLD",
      pt: "Privado - Só você, o dono, pode comprar SLDs nesta TLD",
    },
    "Save summary": { de: "Zusammenfassung speichern", es: "Resumen de guardado", pl: "Podsumowanie zapisu", pt: "Resumo de salvamento" },
    "Fallback Price": { de: "Fallback-Preis", es: "Precio base", pl: "Cena domyślna", pt: "Preço padrão" },
    "Max / Wallet": { de: "Max. / Wallet", es: "Máx. / wallet", pl: "Maks. / portfel", pt: "Máx. / carteira" },
    "Recipient": { de: "Empfänger", es: "Destinatario", pl: "Odbiorca", pt: "Destinatário" },
    "Save Policy": { de: "Richtlinie speichern", es: "Guardar política", pl: "Zapisz politykę", pt: "Salvar política" },
    "Transfer Ownership": { de: "Eigentum übertragen", es: "Transferir propiedad", pl: "Przenieś własność", pt: "Transferir propriedade" },
    "Send this name to another Cosmos address. This is permanent after wallet confirmation.": {
      de: "Sende diesen Namen an eine andere Cosmos-Adresse. Nach der Wallet-Bestätigung ist das dauerhaft.",
      es: "Envía este nombre a otra dirección Cosmos. Es permanente tras la confirmación de la wallet.",
      pl: "Wyślij tę nazwę na inny adres Cosmos. Po potwierdzeniu w portfelu jest to trwałe.",
      pt: "Envie este nome para outro endereço Cosmos. Isso é permanente após a confirmação da carteira.",
    },
    "Permanent": { de: "Dauerhaft", es: "Permanente", pl: "Trwałe", pt: "Permanente" },
    "After transfer, the new wallet controls this name. There is no undo button, because blockchains apparently enjoy dramatic consequences.": {
      de: "Nach der Übertragung kontrolliert das neue Wallet diesen Namen. Es gibt keinen Rückgängig-Button, weil Blockchains offenbar dramatische Konsequenzen mögen.",
      es: "Tras la transferencia, la nueva wallet controla este nombre. No hay botón de deshacer, porque las blockchains aparentemente disfrutan las consecuencias dramáticas.",
      pl: "Po transferze nowy portfel kontroluje tę nazwę. Nie ma przycisku cofania, bo blockchainy najwyraźniej lubią dramatyczne konsekwencje.",
      pt: "Após a transferência, a nova carteira controla este nome. Não há botão de desfazer, porque blockchains aparentemente gostam de consequências dramáticas.",
    },
    "New Owner": { de: "Neuer Besitzer", es: "Nuevo propietario", pl: "Nowy właściciel", pt: "Novo dono" },
    "Confirm Name": { de: "Namen bestätigen", es: "Confirmar nombre", pl: "Potwierdź nazwę", pt: "Confirmar nome" },
    "Type this name to confirm": { de: "Diesen Namen zur Bestätigung eingeben", es: "Escribe este nombre para confirmar", pl: "Wpisz tę nazwę, aby potwierdzić", pt: "Digite este nome para confirmar" },
    "Confirm transfer name": { de: "Transfernamen bestätigen", es: "Confirmar nombre de transferencia", pl: "Potwierdź nazwę transferu", pt: "Confirmar nome da transferência" },
    "Transfer": { de: "Übertragen", es: "Transferir", pl: "Przenieś", pt: "Transferir" },
    "Type the current name exactly to unlock transfer.": {
      de: "Gib den aktuellen Namen exakt ein, um die Übertragung freizuschalten.",
      es: "Escribe el nombre actual exactamente para desbloquear la transferencia.",
      pl: "Wpisz dokładnie obecną nazwę, aby odblokować transfer.",
      pt: "Digite exatamente o nome atual para liberar a transferência.",
    },

    "Configure subdomain registration for your TLDs.": {
      de: "Konfiguriere Subdomain-Registrierung für deine TLDs.",
      es: "Configura el registro de subdominios para tus TLDs.",
      pl: "Skonfiguruj rejestrację subdomen dla swoich TLD.",
      pt: "Configure o registro de subdomínios para suas TLDs.",
    },
    "Your TLDs": { de: "Deine TLDs", es: "Tus TLDs", pl: "Twoje TLD", pt: "Suas TLDs" },
    "Connect wallet to see your TLDs": {
      de: "Wallet verbinden, um deine TLDs zu sehen",
      es: "Conecta la wallet para ver tus TLDs",
      pl: "Połącz portfel, aby zobaczyć swoje TLD",
      pt: "Conecte a carteira para ver suas TLDs",
    },
    "Editing policy for": { de: "Richtlinie bearbeiten für", es: "Editando política para", pl: "Edycja polityki dla", pt: "Editando política para" },
    "Registration Settings": { de: "Registrierungseinstellungen", es: "Ajustes de registro", pl: "Ustawienia rejestracji", pt: "Configurações de registro" },
    "✅ Public - everyone can purchase SLDs": {
      de: "✅ Öffentlich - jeder kann SLDs kaufen",
      es: "✅ Público - todos pueden comprar SLDs",
      pl: "✅ Publiczne - każdy może kupować SLD",
      pt: "✅ Público - todos podem comprar SLDs",
    },
    "🔒 Private - only owner can purchase SLDs": {
      de: "🔒 Privat - nur der Besitzer kann SLDs kaufen",
      es: "🔒 Privado - solo el propietario puede comprar SLDs",
      pl: "🔒 Prywatne - tylko właściciel może kupować SLD",
      pt: "🔒 Privado - só o dono pode comprar SLDs",
    },
    "Max names per address": { de: "Max. Namen pro Adresse", es: "Máx. nombres por dirección", pl: "Maks. nazw na adres", pt: "Máx. nomes por endereço" },
    "CURRENT ON-CHAIN POLICY": { de: "AKTUELLE ON-CHAIN-RICHTLINIE", es: "POLÍTICA ON-CHAIN ACTUAL", pl: "OBECNA POLITYKA ON-CHAIN", pt: "POLÍTICA ON-CHAIN ATUAL" },
    "Max/address": { de: "Max./Adresse", es: "Máx./dirección", pl: "Maks./adres", pt: "Máx./endereço" },
    "Save Settings On-Chain": { de: "Einstellungen on-chain speichern", es: "Guardar ajustes on-chain", pl: "Zapisz ustawienia on-chain", pt: "Salvar configurações on-chain" },
    "This executes SetSubdomainPolicy on the registry contract. Gas fee in ATOM.": {
      de: "Dies führt SetSubdomainPolicy im Registry-Vertrag aus. Gasgebühr in ATOM.",
      es: "Esto ejecuta SetSubdomainPolicy en el contrato del registro. Comisión de gas en ATOM.",
      pl: "To wykonuje SetSubdomainPolicy na kontrakcie rejestru. Opłata gas w ATOM.",
      pt: "Isso executa SetSubdomainPolicy no contrato do registro. Taxa de gas em ATOM.",
    },
    "Disable Subdomain Registration": { de: "Subdomain-Registrierung deaktivieren", es: "Desactivar registro de subdominios", pl: "Wyłącz rejestrację subdomen", pt: "Desativar registro de subdomínios" },
    "Remove the subdomain policy entirely. Registrations will be disabled until you set a new policy.": {
      de: "Entferne die Subdomain-Richtlinie vollständig. Registrierungen bleiben deaktiviert, bis du eine neue Richtlinie setzt.",
      es: "Elimina la política de subdominios por completo. Los registros se desactivarán hasta que establezcas una nueva política.",
      pl: "Usuń politykę subdomen całkowicie. Rejestracje będą wyłączone, dopóki nie ustawisz nowej polityki.",
      pt: "Remova totalmente a política de subdomínios. Registros ficarão desativados até você definir uma nova política.",
    },
    "Disable Registration": { de: "Registrierung deaktivieren", es: "Desactivar registro", pl: "Wyłącz rejestrację", pt: "Desativar registro" },
    "⚡ SUBMITTING - DO NOT CLOSE": {
      de: "⚡ WIRD GESENDET - NICHT SCHLIESSEN",
      es: "⚡ ENVIANDO - NO CIERRES",
      pl: "⚡ WYSYŁANIE - NIE ZAMYKAJ",
      pt: "⚡ ENVIANDO - NÃO FECHE",
    },

    "Choose your wallet to register names, manage TLDs, and view your portfolio.": {
      de: "Wähle dein Wallet, um Namen zu registrieren, TLDs zu verwalten und dein Portfolio anzusehen.",
      es: "Elige tu wallet para registrar nombres, gestionar TLDs y ver tu portfolio.",
      pl: "Wybierz portfel, aby rejestrować nazwy, zarządzać TLD i oglądać portfolio.",
      pt: "Escolha sua carteira para registrar nomes, gerenciar TLDs e ver seu portfólio.",
    },
    "Supports Keplr · Cosmostation · Ledger · Keystone": {
      de: "Unterstützt Keplr · Cosmostation · Ledger · Keystone",
      es: "Compatible con Keplr · Cosmostation · Ledger · Keystone",
      pl: "Obsługuje Keplr · Cosmostation · Ledger · Keystone",
      pt: "Suporta Keplr · Cosmostation · Ledger · Keystone",
    },
    "Connected Account": { de: "Verbundenes Konto", es: "Cuenta conectada", pl: "Połączone konto", pt: "Conta conectada" },
    "Names": { de: "Namen", es: "Nombres", pl: "Nazwy", pt: "Nomes" },
    "Select your wallet to continue": { de: "Wähle dein Wallet, um fortzufahren", es: "Selecciona tu wallet para continuar", pl: "Wybierz portfel, aby kontynuować", pt: "Selecione sua carteira para continuar" },
    "Browser wallet for Cosmos and multichain Web3 apps": {
      de: "Browser-Wallet für Cosmos und Multichain-Web3-Apps",
      es: "Wallet de navegador para Cosmos y apps Web3 multichain",
      pl: "Portfel przeglądarkowy dla Cosmos i aplikacji Web3 multichain",
      pt: "Carteira de navegador para Cosmos e apps Web3 multichain",
    },
    "Cosmos ecosystem wallet with staking and Web3 support": {
      de: "Wallet für das Cosmos-Ökosystem mit Staking und Web3-Support",
      es: "Wallet del ecosistema Cosmos con staking y soporte Web3",
      pl: "Portfel ekosystemu Cosmos ze stakingiem i obsługą Web3",
      pt: "Carteira do ecossistema Cosmos com staking e suporte Web3",
    },
    "Hardware wallet · USB · Cosmos app required · Chrome/Edge only": {
      de: "Hardware-Wallet · USB · Cosmos-App erforderlich · nur Chrome/Edge",
      es: "Wallet hardware · USB · app Cosmos requerida · solo Chrome/Edge",
      pl: "Portfel sprzętowy · USB · wymagana aplikacja Cosmos · tylko Chrome/Edge",
      pt: "Carteira hardware · USB · app Cosmos obrigatório · apenas Chrome/Edge",
    },
    "Native QR signing · no Keplr dependency · Keystone Pro": {
      de: "Natives QR-Signing · keine Keplr-Abhängigkeit · Keystone Pro",
      es: "Firma QR nativa · sin dependencia de Keplr · Keystone Pro",
      pl: "Natywne podpisywanie QR · bez zależności od Keplr · Keystone Pro",
      pt: "Assinatura QR nativa · sem dependência do Keplr · Keystone Pro",
    },
    "Cancel": { de: "Abbrechen", es: "Cancelar", pl: "Anuluj", pt: "Cancelar" },

    "Utility layer": { de: "Utility-Schicht", es: "Capa de utilidad", pl: "Warstwa użytkowa", pt: "Camada de utilidade" },
    "Explore the Atom Registry Layer": {
      de: "Entdecke die Atom Registry-Schicht",
      es: "Explora la capa Atom Registry",
      pl: "Poznaj warstwę Atom Registry",
      pt: "Explore a camada Atom Registry",
    },
    "Explore the": { de: "Entdecke die", es: "Explora la", pl: "Poznaj", pt: "Explore a" },
    "Atom Registry Layer": { de: "Atom Registry-Schicht", es: "capa Atom Registry", pl: "warstwę Atom Registry", pt: "camada Atom Registry" },
    "Domains are not just names. Use them for browser-native Web3 sites, wallet resolution, resolver records and public identity across Cosmos.": {
      de: "Domains sind nicht nur Namen. Nutze sie für browsernative Web3-Sites, Wallet-Auflösung, Resolver-Einträge und öffentliche Identität in Cosmos.",
      es: "Los dominios no son solo nombres. Úsalos para sitios Web3 nativos del navegador, resolución de wallets, registros resolver e identidad pública en Cosmos.",
      pl: "Domeny to nie tylko nazwy. Używaj ich do natywnych stron Web3 w przeglądarce, rozwiązywania portfeli, rekordów resolvera i publicznej tożsamości w Cosmos.",
      pt: "Domínios não são apenas nomes. Use-os para sites Web3 nativos do navegador, resolução de carteiras, registros resolver e identidade pública no Cosmos.",
    },
    "Browser Extension": { de: "Browser-Erweiterung", es: "Extensión del navegador", pl: "Rozszerzenie przeglądarki", pt: "Extensão do navegador" },
    "Open Web3 domains directly.": {
      de: "Öffne Web3-Domains direkt.",
      es: "Abre dominios Web3 directamente.",
      pl: "Otwieraj domeny Web3 bezpośrednio.",
      pt: "Abra domínios Web3 diretamente.",
    },
    "Browse on-chain sites and resolver-powered domains from your browser without copying contract data like a sleep-deprived block explorer goblin.": {
      de: "Durchsuche On-chain-Sites und resolverbasierte Domains direkt im Browser, ohne Contract-Daten wie ein schlafloser Block-Explorer-Goblin zu kopieren.",
      es: "Navega sitios on-chain y dominios con resolver desde tu navegador sin copiar datos de contratos como un duende de explorador de bloques sin dormir.",
      pl: "Przeglądaj strony on-chain i domeny obsługiwane przez resolver z poziomu przeglądarki, bez kopiowania danych kontraktu jak niewyspany goblin od block explorera.",
      pt: "Navegue por sites on-chain e domínios com resolver pelo navegador sem copiar dados de contrato como um goblin de explorador de blocos sem dormir.",
    },
    "Install Extension": { de: "Erweiterung installieren", es: "Instalar extensión", pl: "Zainstaluj rozszerzenie", pt: "Instalar extensão" },
    "Resolved through Atom Registry": { de: "Aufgelöst über Atom Registry", es: "Resuelto por Atom Registry", pl: "Rozwiązane przez Atom Registry", pt: "Resolvido pela Atom Registry" },
    "Wallet Resolution": { de: "Wallet-Auflösung", es: "Resolución de wallet", pl: "Rozwiązywanie portfela", pt: "Resolução de carteira" },
    "Send to names, not chaos.": {
      de: "Sende an Namen, nicht an Chaos.",
      es: "Envía a nombres, no al caos.",
      pl: "Wysyłaj na nazwy, nie w chaos.",
      pt: "Envie para nomes, não para o caos.",
    },
    "Resolve domains to wallet addresses, profiles and records so users do not have to worship long cosmos1... strings.": {
      de: "Löse Domains zu Wallet-Adressen, Profilen und Einträgen auf, damit Nutzer keine langen cosmos1...-Strings verehren müssen.",
      es: "Resuelve dominios a direcciones de wallet, perfiles y registros para que los usuarios no tengan que venerar cadenas cosmos1... largas.",
      pl: "Rozwiązuj domeny do adresów portfeli, profili i rekordów, żeby użytkownicy nie musieli czcić długich ciągów cosmos1...",
      pt: "Resolva domínios para endereços de carteira, perfis e registros para que usuários não precisem venerar longas strings cosmos1...",
    },
    "Resolved": { de: "Aufgelöst", es: "Resuelto", pl: "Rozwiązane", pt: "Resolvido" },

    "Secondary market": { de: "Sekundärmarkt", es: "Mercado secundario", pl: "Rynek wtórny", pt: "Mercado secundário" },
    "Marketplace": { de: "Marktplatz", es: "Mercado", pl: "Rynek", pt: "Mercado" },
    "Market": { de: "Markt", es: "Mercado", pl: "Rynek", pt: "Mercado" },
    "place": { de: "platz", es: "", pl: "", pt: "" },
    "Names are assets. Browse listed domains, discover premium namespaces and prepare to trade Atom Registry names directly from your wallet.": {
      de: "Namen sind Assets. Durchsuche gelistete Domains, entdecke Premium-Namespaces und bereite dich darauf vor, Atom Registry-Namen direkt aus deinem Wallet zu handeln.",
      es: "Los nombres son activos. Explora dominios listados, descubre namespaces premium y prepárate para comerciar nombres de Atom Registry directamente desde tu wallet.",
      pl: "Nazwy są aktywami. Przeglądaj wystawione domeny, odkrywaj premium przestrzenie nazw i przygotuj się do handlu nazwami Atom Registry bezpośrednio z portfela.",
      pt: "Nomes são ativos. Navegue por domínios listados, descubra namespaces premium e prepare-se para negociar nomes da Atom Registry diretamente pela carteira.",
    },
    "Marketplace highlights": { de: "Marktplatz-Highlights", es: "Destacados del mercado", pl: "Najważniejsze cechy rynku", pt: "Destaques do mercado" },
    "Asset types": { de: "Asset-Typen", es: "Tipos de activo", pl: "Typy aktywów", pt: "Tipos de ativo" },
    "Domains + TLDs": { de: "Domains + TLDs", es: "Dominios + TLDs", pl: "Domeny + TLD", pt: "Domínios + TLDs" },
    "Settlement": { de: "Abwicklung", es: "Liquidación", pl: "Rozliczenie", pt: "Liquidação" },
    "On-chain ready": { de: "On-chain bereit", es: "Listo on-chain", pl: "Gotowe on-chain", pt: "Pronto on-chain" },
    "Open Marketplace": { de: "Marktplatz öffnen", es: "Abrir mercado", pl: "Otwórz rynek", pt: "Abrir mercado" },
    "Live board": { de: "Live-Board", es: "Tablero en vivo", pl: "Tablica live", pt: "Painel ao vivo" },
    "Featured listings": { de: "Ausgewählte Listings", es: "Listados destacados", pl: "Wyróżnione oferty", pt: "Listagens em destaque" },
    "View all": { de: "Alle ansehen", es: "Ver todo", pl: "Zobacz wszystko", pt: "Ver tudo" },
    "Loading marketplace...": { de: "Marktplatz wird geladen...", es: "Cargando mercado...", pl: "Ładowanie rynku...", pt: "Carregando mercado..." },
    "Reading active listings from Cosmos Hub.": {
      de: "Aktive Listings werden von Cosmos Hub gelesen.",
      es: "Leyendo listados activos desde Cosmos Hub.",
      pl: "Odczytywanie aktywnych ofert z Cosmos Hub.",
      pt: "Lendo listagens ativas do Cosmos Hub.",
    },

    "Questions people ask before clicking expensive blockchain buttons": {
      de: "Fragen, die Menschen stellen, bevor sie teure Blockchain-Buttons anklicken",
      es: "Preguntas que la gente hace antes de pulsar botones caros de blockchain",
      pl: "Pytania, które ludzie zadają przed klikaniem drogich blockchainowych przycisków",
      pt: "Perguntas que as pessoas fazem antes de clicar em botões caros de blockchain",
    },
    "Simple answers, because the product should feel trustworthy before anyone signs a transaction.": {
      de: "Einfache Antworten, weil sich das Produkt vertrauenswürdig anfühlen sollte, bevor jemand eine Transaktion signiert.",
      es: "Respuestas simples, porque el producto debe inspirar confianza antes de que alguien firme una transacción.",
      pl: "Proste odpowiedzi, bo produkt powinien budzić zaufanie, zanim ktokolwiek podpisze transakcję.",
      pt: "Respostas simples, porque o produto deve parecer confiável antes de alguém assinar uma transação.",
    },
    "Do I need to renew my domain?": {
      de: "Muss ich meine Domain verlängern?",
      es: "¿Tengo que renovar mi dominio?",
      pl: "Czy muszę odnawiać domenę?",
      pt: "Preciso renovar meu domínio?",
    },
    "No. You pay once and own it permanently unless you transfer it.": {
      de: "Nein. Du zahlst einmal und besitzt sie dauerhaft, bis du sie überträgst.",
      es: "No. Pagas una vez y la posees permanentemente salvo que la transfieras.",
      pl: "Nie. Płacisz raz i posiadasz ją na stałe, chyba że ją przeniesiesz.",
      pt: "Não. Você paga uma vez e possui permanentemente, a menos que transfira.",
    },
    "Where is ownership stored?": {
      de: "Wo wird Eigentum gespeichert?",
      es: "¿Dónde se almacena la propiedad?",
      pl: "Gdzie zapisana jest własność?",
      pt: "Onde a propriedade é armazenada?",
    },
    "Ownership is recorded on Cosmos Hub through smart contracts and can be verified publicly.": {
      de: "Eigentum wird über Smart Contracts auf Cosmos Hub gespeichert und ist öffentlich prüfbar.",
      es: "La propiedad se registra en Cosmos Hub mediante smart contracts y puede verificarse públicamente.",
      pl: "Własność jest zapisana na Cosmos Hub przez smart kontrakty i może być publicznie zweryfikowana.",
      pt: "A propriedade é registrada no Cosmos Hub por smart contracts e pode ser verificada publicamente.",
    },
    "Can I transfer a domain?": {
      de: "Kann ich eine Domain übertragen?",
      es: "¿Puedo transferir un dominio?",
      pl: "Czy mogę przenieść domenę?",
      pt: "Posso transferir um domínio?",
    },
    "Yes. Names and TLDs can be transferred to another Cosmos address.": {
      de: "Ja. Namen und TLDs können an eine andere Cosmos-Adresse übertragen werden.",
      es: "Sí. Los nombres y TLDs pueden transferirse a otra dirección Cosmos.",
      pl: "Tak. Nazwy i TLD mogą być przeniesione na inny adres Cosmos.",
      pt: "Sim. Nomes e TLDs podem ser transferidos para outro endereço Cosmos.",
    },
    "Which wallets are supported?": {
      de: "Welche Wallets werden unterstützt?",
      es: "¿Qué wallets son compatibles?",
      pl: "Które portfele są obsługiwane?",
      pt: "Quais carteiras são suportadas?",
    },
    "Keplr, Cosmostation, Ledger and Keystone are supported in the wallet flow.": {
      de: "Keplr, Cosmostation, Ledger und Keystone werden im Wallet-Flow unterstützt.",
      es: "Keplr, Cosmostation, Ledger y Keystone son compatibles en el flujo de wallet.",
      pl: "Keplr, Cosmostation, Ledger i Keystone są obsługiwane w procesie portfela.",
      pt: "Keplr, Cosmostation, Ledger e Keystone são suportados no fluxo de carteira.",
    },
    "What happens after I buy a domain?": {
      de: "Was passiert, nachdem ich eine Domain kaufe?",
      es: "¿Qué pasa después de comprar un dominio?",
      pl: "Co się dzieje po zakupie domeny?",
      pt: "O que acontece depois que eu compro um domínio?",
    },
    "You can manage records, set it as primary, transfer it, or keep it in your wallet permanently.": {
      de: "Du kannst Einträge verwalten, sie als primär setzen, übertragen oder dauerhaft in deinem Wallet behalten.",
      es: "Puedes gestionar registros, establecerlo como principal, transferirlo o mantenerlo permanentemente en tu wallet.",
      pl: "Możesz zarządzać rekordami, ustawić ją jako główną, przenieść albo trzymać w portfelu na stałe.",
      pt: "Você pode gerenciar registros, definir como principal, transferir ou manter permanentemente na carteira.",
    },
    "Can I own an entire TLD?": {
      de: "Kann ich eine ganze TLD besitzen?",
      es: "¿Puedo poseer una TLD completa?",
      pl: "Czy mogę posiadać całe TLD?",
      pt: "Posso possuir uma TLD inteira?",
    },
    "Yes. You can register a whole namespace like .dao, .web3 or .brand and configure registrations under it.": {
      de: "Ja. Du kannst einen ganzen Namespace wie .dao, .web3 oder .brand registrieren und Registrierungen darunter konfigurieren.",
      es: "Sí. Puedes registrar un namespace completo como .dao, .web3 o .brand y configurar registros bajo él.",
      pl: "Tak. Możesz zarejestrować całą przestrzeń nazw jak .dao, .web3 lub .brand i skonfigurować rejestracje pod nią.",
      pt: "Sim. Você pode registrar um namespace inteiro como .dao, .web3 ou .brand e configurar registros sob ele.",
    },

    "From 15 ATOM. Price varies by TLD length. Own the namespace forever.": {
      de: "Ab 15 ATOM. Der Preis variiert je nach TLD-Länge. Besitze den Namespace für immer.",
      es: "Desde 15 ATOM. El precio varía según la longitud del TLD. Posee el namespace para siempre.",
      pl: "Od 15 ATOM. Cena zależy od długości TLD. Posiadaj przestrzeń nazw na zawsze.",
      pt: "A partir de 15 ATOM. O preço varia conforme o tamanho da TLD. Possua o namespace para sempre.",
    },
    "Domain must be at least 2 characters long": {
      de: "Die Domain muss mindestens 2 Zeichen lang sein",
      es: "El dominio debe tener al menos 2 caracteres",
      pl: "Domena musi mieć co najmniej 2 znaki",
      pt: "O domínio deve ter pelo menos 2 caracteres",
    },
    "Search live namespaces, discover featured names and find the perfect one to register.": {
      de: "Durchsuche aktive Namespaces, entdecke vorgestellte Namen und finde den perfekten zum Registrieren.",
      es: "Busca namespaces activos, descubre nombres destacados y encuentra el perfecto para registrar.",
      pl: "Przeszukaj aktywne przestrzenie nazw, odkryj wyróżnione nazwy i znajdź idealną do zarejestrowania.",
      pt: "Pesquise namespaces ativos, descubra nomes em destaque e encontre o perfeito para registrar.",
    },

    "Sell": { de: "Verkaufen", es: "Vender", pl: "Sprzedaj", pt: "Vender" },
    "Create": { de: "Erstellen", es: "Crear", pl: "Utwórz", pt: "Criar" },
    "Manage": { de: "Verwalten", es: "Gestionar", pl: "Zarządzaj", pt: "Gerenciar" },
    "Delete": { de: "Löschen", es: "Eliminar", pl: "Usuń", pt: "Excluir" },
    "Subdomains of": { de: "Subdomains von", es: "Subdominios de", pl: "Subdomeny z", pt: "Subdomínios de" },
    "No subdomains yet. Create the first one above.": {
      de: "Noch keine Subdomains. Erstelle oben die erste.",
      es: "Aún no hay subdominios. Crea el primero arriba.",
      pl: "Brak subdomen. Utwórz pierwszą powyżej.",
      pt: "Nenhum subdomínio ainda. Crie o primeiro acima.",
    },
    "Loading subdomains...": {
      de: "Subdomains werden geladen...",
      es: "Cargando subdominios...",
      pl: "Ładowanie subdomen...",
      pt: "Carregando subdomínios...",
    },
    "Failed to load subdomains.": {
      de: "Subdomains konnten nicht geladen werden.",
      es: "Error al cargar subdominios.",
      pl: "Nie udało się załadować subdomen.",
      pt: "Falha ao carregar subdomínios.",
    },
    "Invalid - lowercase letters, numbers, hyphens only; no leading or trailing hyphen": {
      de: "Ungültig - nur Kleinbuchstaben, Zahlen und Bindestriche; kein führender oder abschließender Bindestrich",
      es: "Inválido - solo letras minúsculas, números y guiones; sin guión al inicio ni al final",
      pl: "Nieprawidłowe - tylko małe litery, cyfry i łączniki; bez łącznika na początku ani końcu",
      pt: "Inválido - apenas letras minúsculas, números e hífens; sem hífen no início ou no fim",
    },

    "Web3 domains and TLD ownership on Cosmos Hub. Pay once, own permanently, manage from your wallet, and verify ownership on-chain.": {
      de: "Web3-Domains und TLD-Eigentum auf Cosmos Hub. Einmal zahlen, dauerhaft besitzen, aus dem Wallet verwalten und Eigentum on-chain prüfen.",
      es: "Dominios Web3 y propiedad de TLDs en Cosmos Hub. Paga una vez, posee permanentemente, gestiona desde tu wallet y verifica la propiedad on-chain.",
      pl: "Domeny Web3 i własność TLD na Cosmos Hub. Płać raz, posiadaj na stałe, zarządzaj z portfela i weryfikuj własność on-chain.",
      pt: "Domínios Web3 e propriedade de TLDs no Cosmos Hub. Pague uma vez, possua permanentemente, gerencie pela carteira e verifique on-chain.",
    },
    "Developers": { de: "Entwickler", es: "Desarrolladores", pl: "Deweloperzy", pt: "Desenvolvedores" },
    "Docs": { de: "Dokumentation", es: "Documentación", pl: "Dokumentacja", pt: "Docs" },
    "Contracts": { de: "Verträge", es: "Contratos", pl: "Kontrakty", pt: "Contratos" },
    "Network": { de: "Netzwerk", es: "Red", pl: "Sieć", pt: "Rede" },
    "Legal": { de: "Rechtliches", es: "Legal", pl: "Prawne", pt: "Legal" },
    "Terms": { de: "Bedingungen", es: "Términos", pl: "Warunki", pt: "Termos" },
    "Privacy": { de: "Datenschutz", es: "Privacidad", pl: "Prywatność", pt: "Privacidade" },
    "Disclaimer": { de: "Haftungsausschluss", es: "Aviso legal", pl: "Zastrzeżenie", pt: "Aviso legal" },
    "Cosmos Hub • CosmWasm • Forever Ownership • No Renewals": {
      de: "Cosmos Hub • CosmWasm • Dauerhaftes Eigentum • Keine Verlängerungen",
      es: "Cosmos Hub • CosmWasm • Propiedad permanente • Sin renovaciones",
      pl: "Cosmos Hub • CosmWasm • Własność na zawsze • Bez odnowień",
      pt: "Cosmos Hub • CosmWasm • Propriedade permanente • Sem renovações",
    },

    "Toggle navigation": { de: "Navigation umschalten", es: "Alternar navegación", pl: "Przełącz nawigację", pt: "Alternar navegação" },
    "TX History": { de: "TX-Verlauf", es: "Historial de TX", pl: "Historia TX", pt: "Histórico de TX" },
    "Profiles": { de: "Profile", es: "Perfiles", pl: "Profile", pt: "Perfis" },
    "Doc-Contract": { de: "Doc-Vertrag", es: "Doc-Contrato", pl: "Doc-Kontrakt", pt: "Doc-Contrato" },
    "Checking Cosmos Hub…": { de: "Cosmos Hub wird geprüft…", es: "Comprobando Cosmos Hub…", pl: "Sprawdzanie Cosmos Hub…", pt: "Verificando Cosmos Hub…" },
    "DEVELOPERS": { de: "ENTWICKLER", es: "DESARROLLADORES", pl: "DEWELOPERZY", pt: "DESENVOLVEDORES" },
    "NETWORK": { de: "NETZWERK", es: "RED", pl: "SIEĆ", pt: "REDE" },
    "LEGAL": { de: "RECHTLICHES", es: "LEGAL", pl: "PRAWNE", pt: "LEGAL" },
    "GitHub": { de: "GitHub", es: "GitHub", pl: "GitHub", pt: "GitHub" },
    "Mintscan": { de: "Mintscan", es: "Mintscan", pl: "Mintscan", pt: "Mintscan" },
    "Keplr": { de: "Keplr", es: "Keplr", pl: "Keplr", pt: "Keplr" },

    "First time here?": { de: "Zum ersten Mal hier?", es: "¿Primera vez aquí?", pl: "Pierwszy raz tutaj?", pt: "Primeira vez aqui?" },
    "Welcome to Atom Registry": { de: "Willkommen bei Atom Registry", es: "Bienvenido a Atom Registry", pl: "Witamy w Atom Registry", pt: "Bem-vindo ao Atom Registry" },
    "Atom Registry lets you register Web3 domain names and TLDs on Cosmos Hub - permanently, with no renewals. You own it on-chain forever.": {
      de: "Atom Registry ermöglicht dir, Web3-Domainnamen und TLDs auf dem Cosmos Hub zu registrieren – dauerhaft, ohne Verlängerungen. Du besitzt es für immer on-chain.",
      es: "Atom Registry te permite registrar nombres de dominio Web3 y TLDs en Cosmos Hub - permanentemente, sin renovaciones. Lo posees on-chain para siempre.",
      pl: "Atom Registry umożliwia rejestrację domen Web3 i TLD na Cosmos Hub - na stałe, bez odnowień. Posiadasz je on-chain na zawsze.",
      pt: "O Atom Registry permite registrar nomes de domínio Web3 e TLDs no Cosmos Hub - permanentemente, sem renovações. Você os possui on-chain para sempre.",
    },
    "Install Keplr": { de: "Keplr installieren", es: "Instalar Keplr", pl: "Zainstaluj Keplr", pt: "Instalar Keplr" },
    "The Cosmos browser wallet. Free, open-source, takes 2 minutes.": {
      de: "Das Cosmos-Browser-Wallet. Kostenlos, open-source, dauert 2 Minuten.",
      es: "La wallet de navegador para Cosmos. Gratis, código abierto, tarda 2 minutos.",
      pl: "Portfel przeglądarkowy Cosmos. Bezpłatny, open-source, gotowy w 2 minuty.",
      pt: "A carteira de navegador para Cosmos. Grátis, código aberto, leva 2 minutos.",
    },
    "Get Keplr": { de: "Keplr holen", es: "Obtener Keplr", pl: "Pobierz Keplr", pt: "Obter Keplr" },
    "Connect your wallet": { de: "Verbinde dein Wallet", es: "Conecta tu wallet", pl: "Połącz swój portfel", pt: "Conecte sua carteira" },
    "Click \"Connect Wallet\" in the top-right corner and select Keplr.": {
      de: "Klicke auf „Wallet verbinden“ in der oberen rechten Ecke und wähle Keplr.",
      es: "Haz clic en \"Conectar wallet\" en la esquina superior derecha y selecciona Keplr.",
      pl: "Kliknij „Połącz portfel“ w prawym górnym rogu i wybierz Keplr.",
      pt: "Clique em \"Conectar carteira\" no canto superior direito e selecione Keplr.",
    },
    "Register a domain": { de: "Eine Domain registrieren", es: "Registrar un dominio", pl: "Zarejestruj domenę", pt: "Registrar um domínio" },
    "Search for a name like yourname.atom and register it with ATOM.": {
      de: "Suche nach einem Namen wie yourname.atom und registriere ihn mit ATOM.",
      es: "Busca un nombre como yourname.atom y regístralo con ATOM.",
      pl: "Wyszukaj nazwę jak yourname.atom i zarejestruj ją za pomocą ATOM.",
      pt: "Pesquise um nome como yourname.atom e registre-o com ATOM.",
    },
    "Maybe later": { de: "Vielleicht später", es: "Quizás más tarde", pl: "Może później", pt: "Talvez mais tarde" },
    "Transaction confirmed": { de: "Transaktion bestätigt", es: "Transacción confirmada", pl: "Transakcja potwierdzona", pt: "Transação confirmada" },
    "Close": { de: "Schließen", es: "Cerrar", pl: "Zamknij", pt: "Fechar" },

    "Loading public namespaces...": { de: "Öffentliche Namespaces werden geladen...", es: "Cargando namespaces públicos...", pl: "Ładowanie publicznych przestrzeni nazw...", pt: "Carregando namespaces públicos..." },
    "No public registration policies found.": { de: "Keine öffentlichen Registrierungsrichtlinien gefunden.", es: "No se encontraron políticas de registro públicas.", pl: "Nie znaleziono publicznych polityk rejestracji.", pt: "Nenhuma política de registro pública encontrada." },
    "Check TLD availability": { de: "TLD-Verfügbarkeit prüfen", es: "Comprobar disponibilidad de TLD", pl: "Sprawdź dostępność TLD", pt: "Verificar disponibilidade de TLD" },
    "Own a whole .TLD": { de: "Eine ganze .TLD besitzen", es: "Poseer una .TLD completa", pl: "Posiadaj całe .TLD", pt: "Possua uma .TLD inteira" },
    "Register the namespace itself...": { de: "Den Namespace selbst registrieren...", es: "Registrar el propio namespace...", pl: "Zarejestruj samą przestrzeń nazw...", pt: "Registrar o próprio namespace..." },
    "Check another name": { de: "Anderen Namen prüfen", es: "Comprobar otro nombre", pl: "Sprawdź inną nazwę", pt: "Verificar outro nome" },
    "Check another TLD": { de: "Andere TLD prüfen", es: "Comprobar otra TLD", pl: "Sprawdź inną TLD", pt: "Verificar outra TLD" },
    "Try another name or switch TLD.": { de: "Versuche einen anderen Namen oder wechsle die TLD.", es: "Prueba otro nombre o cambia de TLD.", pl: "Spróbuj innej nazwy lub zmień TLD.", pt: "Tente outro nome ou mude de TLD." },
    "Registration for this TLD is currently closed.": { de: "Die Registrierung für diese TLD ist derzeit geschlossen.", es: "El registro para esta TLD está actualmente cerrado.", pl: "Rejestracja dla tej TLD jest obecnie zamknięta.", pt: "O registro para esta TLD está atualmente fechado." },
    "Committing...": { de: "Wird übertragen...", es: "Comprometiendo...", pl: "Potwierdzanie...", pt: "Confirmando..." },
    "Waiting for commit...": { de: "Warte auf Bestätigung...", es: "Esperando confirmación...", pl: "Oczekiwanie na potwierdzenie...", pt: "Aguardando confirmação..." },
    "Commit sent. Wait 10 seconds, because blockchains enjoy tiny rituals.": {
      de: "Commit gesendet. Warte 10 Sekunden, weil Blockchains kleine Rituale mögen.",
      es: "Commit enviado. Espera 10 segundos, porque a las blockchains les gustan los rituales pequeños.",
      pl: "Commit wysłany. Poczekaj 10 sekund, bo blockchainy lubią małe rytuały.",
      pt: "Commit enviado. Aguarde 10 segundos, porque blockchains gostam de pequenos rituais.",
    },
    "Registered - view my domains": { de: "Registriert - meine Domains ansehen", es: "Registrado - ver mis dominios", pl: "Zarejestrowano - przejdź do moich domen", pt: "Registrado - ver meus domínios" },
    "Enter a TLD first": { de: "Zuerst eine TLD eingeben", es: "Introduce una TLD primero", pl: "Najpierw wpisz TLD", pt: "Insira uma TLD primeiro" },
    "Enter a name first": { de: "Zuerst einen Namen eingeben", es: "Introduce un nombre primero", pl: "Najpierw wpisz nazwę", pt: "Insira um nome primeiro" },
    "Enter a name": { de: "Namen eingeben", es: "Introduce un nombre", pl: "Wpisz nazwę", pt: "Insira um nome" },
    "Use lowercase letters, numbers or hyphens": { de: "Kleinbuchstaben, Zahlen oder Bindestriche verwenden", es: "Usa letras minúsculas, números o guiones", pl: "Używaj małych liter, cyfr lub łączników", pt: "Use letras minúsculas, números ou hífens" },
    "No TLDs loaded yet. Try refresh.": { de: "Noch keine TLDs geladen. Versuche Aktualisieren.", es: "Aún no se han cargado TLDs. Intenta actualizar.", pl: "Nie załadowano jeszcze żadnych TLD. Spróbuj odświeżyć.", pt: "Nenhuma TLD carregada ainda. Tente atualizar." },
    "Connect wallet first": { de: "Zuerst Wallet verbinden", es: "Conecta la wallet primero", pl: "Najpierw połącz portfel", pt: "Conecte a carteira primeiro" },
    "Commit too young - wait a moment": { de: "Commit zu jung - warte einen Moment", es: "Commit demasiado reciente - espera un momento", pl: "Commit zbyt świeży - poczekaj chwilę", pt: "Commit muito recente - aguarde um momento" },
    "Commit expired - commit again": { de: "Commit abgelaufen - erneut bestätigen", es: "Commit caducado - vuelve a comprometerte", pl: "Commit wygasł - zatwierdź ponownie", pt: "Commit expirado - confirme novamente" },
    "Wait for the commit timer to finish": { de: "Warte, bis der Commit-Timer abläuft", es: "Espera a que termine el temporizador de commit", pl: "Poczekaj na zakończenie odliczania commit", pt: "Aguarde o temporizador de commit terminar" },

    "Available": { de: "Verfügbar", es: "Disponible", pl: "Dostępne", pt: "Disponível" },
    "Taken": { de: "Vergeben", es: "Ocupado", pl: "Zajęte", pt: "Ocupado" },
    "Reserved": { de: "Reserviert", es: "Reservado", pl: "Zarezerwowane", pt: "Reservado" },
    "Not checked": { de: "Nicht geprüft", es: "No comprobado", pl: "Nie sprawdzono", pt: "Não verificado" },
    "AVAILABLE": { de: "VERFÜGBAR", es: "DISPONIBLE", pl: "DOSTĘPNE", pt: "DISPONÍVEL" },
    "RESERVED": { de: "RESERVIERT", es: "RESERVADO", pl: "ZAREZERWOWANE", pt: "RESERVADO" },
    "TAKEN": { de: "VERGEBEN", es: "OCUPADO", pl: "ZAJĘTE", pt: "OCUPADO" },
    "CLOSED": { de: "GESCHLOSSEN", es: "CERRADO", pl: "ZAMKNIĘTE", pt: "FECHADO" },
    "PRIVATE": { de: "PRIVAT", es: "PRIVADO", pl: "PRYWATNE", pt: "PRIVADO" },
    "PUBLIC": { de: "ÖFFENTLICH", es: "PÚBLICO", pl: "PUBLICZNE", pt: "PÚBLICO" },
    "Listed on marketplace": { de: "Im Marktplatz gelistet", es: "Listado en el mercado", pl: "Wystawione na rynku", pt: "Listado no marketplace" },
    "Ready to claim. Start the secure commit-reveal registration flow.": {
      de: "Bereit zur Registrierung. Starte den sicheren Commit-Reveal-Registrierungsablauf.",
      es: "Listo para reclamar. Inicia el flujo de registro commit-reveal seguro.",
      pl: "Gotowe do zgłoszenia. Uruchom bezpieczny proces rejestracji commit-reveal.",
      pt: "Pronto para reivindicar. Inicie o fluxo seguro de registro commit-reveal.",
    },
    "Check failed": { de: "Prüfung fehlgeschlagen", es: "Comprobación fallida", pl: "Sprawdzanie nie powiodło się", pt: "Verificação falhou" },
    "Submitting...": { de: "Wird gesendet...", es: "Enviando...", pl: "Wysyłanie...", pt: "Enviando..." },
    "Commit broadcast!": { de: "Commit übertragen!", es: "¡Commit enviado!", pl: "Commit wysłany!", pt: "Commit transmitido!" },
    "Start secure registration": { de: "Sichere Registrierung starten", es: "Iniciar registro seguro", pl: "Uruchom bezpieczną rejestrację", pt: "Iniciar registro seguro" },
    "Registering...": { de: "Wird registriert...", es: "Registrando...", pl: "Rejestrowanie...", pt: "Registrando..." },
    "Commit expired - please recommit": { de: "Commit abgelaufen - bitte erneut bestätigen", es: "Commit caducado - vuelve a comprometerte", pl: "Commit wygasł - zatwierdź ponownie", pt: "Commit expirado - confirme novamente" },
    "Previous commit expired. Please recommit.": { de: "Vorheriger Commit abgelaufen. Bitte erneut bestätigen.", es: "El commit anterior caducó. Por favor, vuelve a comprometerte.", pl: "Poprzedni commit wygasł. Zatwierdź ponownie.", pt: "Commit anterior expirado. Por favor, confirme novamente." },
    "second": { de: "Sekunde", es: "segundo", pl: "sekunda", pt: "segundo" },
    "seconds": { de: "Sekunden", es: "segundos", pl: "sekund", pt: "segundos" },

    "Permanent ownership": { de: "Dauerhaftes Eigentum", es: "Propiedad permanente", pl: "Trwała własność", pt: "Propriedade permanente" },
    "one-time • forever": { de: "einmalig • für immer", es: "único • para siempre", pl: "jednorazowe • na zawsze", pt: "único • para sempre" },
    "No policy set": { de: "Keine Richtlinie festgelegt", es: "Sin política establecida", pl: "Brak polityki", pt: "Nenhuma política definida" },
    "Registration for this TLD is currently closed by the owner.": {
      de: "Die Registrierung für diese TLD ist derzeit vom Besitzer geschlossen.",
      es: "El registro para esta TLD está actualmente cerrado por el propietario.",
      pl: "Rejestracja dla tej TLD jest obecnie zamknięta przez właściciela.",
      pt: "O registro para esta TLD está atualmente fechado pelo dono.",
    },
    "Checking...": { de: "Wird geprüft...", es: "Comprobando...", pl: "Sprawdzanie...", pt: "Verificando..." },

    "Domain registered successfully": { de: "Domain erfolgreich registriert", es: "Dominio registrado correctamente", pl: "Domena zarejestrowana pomyślnie", pt: "Domínio registrado com sucesso" },
    "Your name is now live on Cosmos Hub. No renewals, no expiry dates, no middleman circus.": {
      de: "Dein Name ist jetzt live auf Cosmos Hub. Keine Verlängerungen, keine Ablaufdaten, kein Mittelsmann.",
      es: "Tu nombre ya está activo en Cosmos Hub. Sin renovaciones, sin fechas de vencimiento, sin intermediarios.",
      pl: "Twoja nazwa jest teraz aktywna na Cosmos Hub. Bez odnowień, bez dat wygaśnięcia, bez pośredników.",
      pt: "Seu nome está agora ativo no Cosmos Hub. Sem renovações, sem datas de vencimento, sem intermediários.",
    },
    "Confirmed on-chain": { de: "On-chain bestätigt", es: "Confirmado on-chain", pl: "Potwierdzone on-chain", pt: "Confirmado on-chain" },
    "Transaction": { de: "Transaktion", es: "Transacción", pl: "Transakcja", pt: "Transação" },
    "Set primary": { de: "Als primär setzen", es: "Establecer como principal", pl: "Ustaw jako główną", pt: "Definir como principal" },
    "Manage records": { de: "Einträge verwalten", es: "Gestionar registros", pl: "Zarządzaj rekordami", pt: "Gerenciar registros" },

    "TOP TIER": { de: "TOP-TIER", es: "TOP TIER", pl: "SZCZYT", pt: "TOP TIER" },
    "PRIME TIER": { de: "PRIME-TIER", es: "PRIME TIER", pl: "PRIME", pt: "PRIME TIER" },
    "STANDARD": { de: "STANDARD", es: "ESTÁNDAR", pl: "STANDARD", pt: "PADRÃO" },
    "Syncing portfolio...": { de: "Portfolio wird synchronisiert...", es: "Sincronizando portfolio...", pl: "Synchronizacja portfolio...", pt: "Sincronizando portfólio..." },
    "No names found": { de: "Keine Namen gefunden", es: "No se encontraron nombres", pl: "Nie znaleziono nazw", pt: "Nenhum nome encontrado" },
    "Your wallet has no names yet.": { de: "Dein Wallet hat noch keine Namen.", es: "Tu wallet no tiene nombres aún.", pl: "Twój portfel nie ma jeszcze żadnych nazw.", pt: "Sua carteira ainda não tem nomes." },
    "NAME": { de: "NAME", es: "NOMBRE", pl: "NAZWA", pt: "NOME" },
    "Registered domain": { de: "Registrierte Domain", es: "Dominio registrado", pl: "Zarejestrowana domena", pt: "Domínio registrado" },
    "Wallet-owned name": { de: "Wallet-eigener Name", es: "Nombre propiedad de wallet", pl: "Nazwa w portfelu", pt: "Nome da carteira" },
    "Error loading portfolio": { de: "Fehler beim Laden des Portfolios", es: "Error al cargar el portfolio", pl: "Błąd ładowania portfolio", pt: "Erro ao carregar portfólio" },
    "Try syncing again.": { de: "Versuche erneut zu synchronisieren.", es: "Intenta sincronizar de nuevo.", pl: "Spróbuj ponownie synchronizować.", pt: "Tente sincronizar novamente." },
    "No domain selected": { de: "Keine Domain ausgewählt", es: "Ningún dominio seleccionado", pl: "Nie wybrano domeny", pt: "Nenhum domínio selecionado" },
    "Transfer successful!": { de: "Transfer erfolgreich!", es: "¡Transferencia exitosa!", pl: "Transfer zakończony pomyślnie!", pt: "Transferência bem-sucedida!" },
    "Policy saved!": { de: "Richtlinie gespeichert!", es: "¡Política guardada!", pl: "Polityka zapisana!", pt: "Política salva!" },
    "Primary name set!": { de: "Primärname gesetzt!", es: "¡Nombre principal establecido!", pl: "Nazwa główna ustawiona!", pt: "Nome principal definido!" },
    "Not ready": { de: "Nicht bereit", es: "No listo", pl: "Nie gotowe", pt: "Não pronto" },
    "Enter a value": { de: "Einen Wert eingeben", es: "Introduce un valor", pl: "Wpisz wartość", pt: "Insira um valor" },
    "Enter recipient address": { de: "Empfängeradresse eingeben", es: "Introduce la dirección del destinatario", pl: "Wpisz adres odbiorcy", pt: "Insira o endereço do destinatário" },
    "DID copied!": { de: "DID kopiert!", es: "¡DID copiado!", pl: "DID skopiowano!", pt: "DID copiado!" },
    "Alias copied!": { de: "Alias kopiert!", es: "¡Alias copiado!", pl: "Alias skopiowano!", pt: "Alias copiado!" },
    "Fetching...": { de: "Wird abgerufen...", es: "Obteniendo...", pl: "Pobieranie...", pt: "Buscando..." },
    "Loading...": { de: "Wird geladen...", es: "Cargando...", pl: "Ładowanie...", pt: "Carregando..." },
    "Could not reach resolver.": { de: "Resolver nicht erreichbar.", es: "No se pudo alcanzar el resolver.", pl: "Nie można połączyć z resolverem.", pt: "Não foi possível alcançar o resolver." },
    "mysubdomain": { de: "meinsubdomain", es: "misubdominio", pl: "mojsubdomen", pt: "meusubdomínio" },

    "Loading listings...": { de: "Listings werden geladen...", es: "Cargando listados...", pl: "Ładowanie ofert...", pt: "Carregando listagens..." },
    "Reading active marketplace listings from Cosmos Hub.": {
      de: "Aktive Marktplatz-Listings von Cosmos Hub werden gelesen.",
      es: "Leyendo listados activos del mercado desde Cosmos Hub.",
      pl: "Odczytywanie aktywnych ofert rynkowych z Cosmos Hub.",
      pt: "Lendo listagens ativas do marketplace no Cosmos Hub.",
    },
    "No domains listed yet": { de: "Noch keine Domains gelistet", es: "Aún no hay dominios listados", pl: "Brak wystawionych domen", pt: "Nenhum domínio listado ainda" },
    "There are no active marketplace listings right now.": {
      de: "Es gibt derzeit keine aktiven Marktplatz-Listings.",
      es: "No hay listados activos en el mercado ahora mismo.",
      pl: "Nie ma teraz żadnych aktywnych ofert rynkowych.",
      pt: "Não há listagens ativas no marketplace agora.",
    },
    "Marketplace unavailable": { de: "Marktplatz nicht verfügbar", es: "Mercado no disponible", pl: "Rynek niedostępny", pt: "Marketplace indisponível" },
    "Could not load marketplace listings right now.": {
      de: "Marktplatz-Listings konnten gerade nicht geladen werden.",
      es: "No se pudieron cargar los listados del mercado ahora mismo.",
      pl: "Nie można teraz załadować ofert rynkowych.",
      pt: "Não foi possível carregar as listagens do marketplace agora.",
    },
    "Top-level namespace": { de: "Top-Level-Namespace", es: "Namespace de nivel superior", pl: "Przestrzeń najwyższego poziomu", pt: "Namespace de nível superior" },
    "Wallet identity name": { de: "Wallet-Identitätsname", es: "Nombre de identidad de wallet", pl: "Nazwa tożsamości portfela", pt: "Nome de identidade da carteira" },

    "Copied": { de: "Kopiert", es: "Copiado", pl: "Skopiowano", pt: "Copiado" },
    "Copy failed": { de: "Kopieren fehlgeschlagen", es: "Error al copiar", pl: "Kopiowanie nie powiodło się", pt: "Falha ao copiar" },
    "Copy": { de: "Kopieren", es: "Copiar", pl: "Kopiuj", pt: "Copiar" },
    "Registry": { de: "Registry", es: "Registro", pl: "Rejestr", pt: "Registro" },
    "Registrar": { de: "Registrar", es: "Registrador", pl: "Registrar", pt: "Registrador" },
    "TLD Manager": { de: "TLD-Manager", es: "Gestor de TLD", pl: "Menedżer TLD", pt: "Gerenciador de TLD" },
    "Core name ownership and registry state.": { de: "Zentrales Name-Eigentum und Registry-Status.", es: "Propiedad de nombres y estado del registro principal.", pl: "Centralna własność nazw i stan rejestru.", pt: "Propriedade de nomes central e estado do registro." },
    "Domain registration execution contract.": { de: "Domain-Registrierungs-Ausführungsvertrag.", es: "Contrato de ejecución de registro de dominios.", pl: "Kontrakt wykonania rejestracji domeny.", pt: "Contrato de execução de registro de domínio." },
    "Top-level namespace minting and policy management.": { de: "Top-Level-Namespace-Prägung und Richtlinienverwaltung.", es: "Acuñación de namespace de nivel superior y gestión de políticas.", pl: "Mintowanie przestrzeni najwyższego poziomu i zarządzanie polityką.", pt: "Criação de namespace de nível superior e gerenciamento de políticas." },
    "Records, wallet resolution and web content pointers.": { de: "Einträge, Wallet-Auflösung und Web-Content-Pointer.", es: "Registros, resolución de wallets y punteros de contenido web.", pl: "Rekordy, rozwiązywanie portfeli i wskaźniki treści webowych.", pt: "Registros, resolução de carteiras e ponteiros de conteúdo web." },
    "Fixed-price domain listing, purchase and cancellation.": { de: "Festpreis-Domain-Listing, Kauf und Stornierung.", es: "Listado de dominios a precio fijo, compra y cancelación.", pl: "Wystawienie domeny po stałej cenie, zakup i anulowanie.", pt: "Listagem de domínio a preço fixo, compra e cancelamento." },
    "Profile and metadata records for domains.": { de: "Profil- und Metadaten-Einträge für Domains.", es: "Registros de perfil y metadatos para dominios.", pl: "Rekordy profilu i metadanych dla domen.", pt: "Registros de perfil e metadados para domínios." },
    "dSSL certificate style records and validation state.": { de: "dSSL-zertifikatartige Einträge und Validierungsstatus.", es: "Registros estilo certificado dSSL y estado de validación.", pl: "Rekordy w stylu certyfikatu dSSL i stan walidacji.", pt: "Registros estilo certificado dSSL e estado de validação." },
    "Contracts and endpoints": { de: "Verträge und Endpunkte", es: "Contratos y puntos de conexión", pl: "Kontrakty i punkty końcowe", pt: "Contratos e endpoints" },
    "Verify before signing": { de: "Vor dem Signieren prüfen", es: "Verifica antes de firmar", pl: "Sprawdź przed podpisaniem", pt: "Verifique antes de assinar" },
    "Smart contracts": { de: "Smart Contracts", es: "Contratos inteligentes", pl: "Smart kontrakty", pt: "Contratos inteligentes" },
    "REST endpoints": { de: "REST-Endpunkte", es: "Puntos de conexión REST", pl: "Punkty końcowe REST", pt: "Endpoints REST" },

    "No metadata fields found. Add avatar, bio, website or social links to build a useful domain profile.": {
      de: "Keine Metadatenfelder gefunden. Füge Avatar, Bio, Website oder soziale Links hinzu, um ein nützliches Domainprofil zu erstellen.",
      es: "No se encontraron campos de metadatos. Añade avatar, bio, sitio web o enlaces sociales para crear un perfil de dominio útil.",
      pl: "Nie znaleziono pól metadanych. Dodaj awatar, bio, stronę internetową lub linki społecznościowe, aby zbudować przydatny profil domeny.",
      pt: "Nenhum campo de metadados encontrado. Adicione avatar, bio, website ou links sociais para criar um perfil de domínio útil.",
    },
    "Connect wallet to load owned names": { de: "Wallet verbinden, um eigene Namen zu laden", es: "Conecta la wallet para cargar los nombres propios", pl: "Połącz portfel, aby załadować posiadane nazwy", pt: "Conecte a carteira para carregar nomes próprios" },
    "No owned names found": { de: "Keine eigenen Namen gefunden", es: "No se encontraron nombres propios", pl: "Nie znaleziono posiadanych nazw", pt: "Nenhum nome próprio encontrado" },
    "Loading owned names…": { de: "Eigene Namen werden geladen…", es: "Cargando nombres propios…", pl: "Ładowanie posiadanych nazw…", pt: "Carregando nomes próprios…" },
    "Could not load owned names": { de: "Eigene Namen konnten nicht geladen werden", es: "No se pudieron cargar los nombres propios", pl: "Nie można załadować posiadanych nazw", pt: "Não foi possível carregar nomes próprios" },
    "Loading saved fields…": { de: "Gespeicherte Felder werden geladen…", es: "Cargando campos guardados…", pl: "Ładowanie zapisanych pól…", pt: "Carregando campos salvos…" },
    "Select an owned domain": { de: "Eine eigene Domain auswählen", es: "Selecciona un dominio propio", pl: "Wybierz posiadaną domenę", pt: "Selecione um domínio próprio" },
    "Enter a field key": { de: "Einen Feldschlüssel eingeben", es: "Introduce una clave de campo", pl: "Wpisz klucz pola", pt: "Insira uma chave de campo" },
    "Add values for at least one selected field": { de: "Werte für mindestens ein ausgewähltes Feld hinzufügen", es: "Añade valores para al menos un campo seleccionado", pl: "Dodaj wartości dla co najmniej jednego wybranego pola", pt: "Adicione valores para pelo menos um campo selecionado" },
    "Profile JSON copied": { de: "Profil-JSON kopiert", es: "JSON de perfil copiado", pl: "JSON profilu skopiowany", pt: "JSON do perfil copiado" },
    "Could not copy JSON": { de: "JSON konnte nicht kopiert werden", es: "No se pudo copiar el JSON", pl: "Nie można skopiować JSON", pt: "Não foi possível copiar o JSON" },
    "Metadata service is online. You can view public profiles or edit domains owned by your connected wallet.": {
      de: "Metadaten-Service ist online. Du kannst öffentliche Profile ansehen oder Domains bearbeiten, die deinem Wallet gehören.",
      es: "El servicio de metadatos está en línea. Puedes ver perfiles públicos o editar dominios de tu wallet conectada.",
      pl: "Usługa metadanych jest online. Możesz przeglądać publiczne profile lub edytować domeny należące do Twojego portfela.",
      pt: "O serviço de metadados está online. Você pode ver perfis públicos ou editar domínios do seu wallet conectado.",
    },
    "Metadata config query failed. Check network status or contract configuration.": {
      de: "Metadaten-Config-Abfrage fehlgeschlagen. Prüfe Netzwerkstatus oder Vertragskonfiguration.",
      es: "La consulta de configuración de metadatos falló. Comprueba el estado de la red o la configuración del contrato.",
      pl: "Zapytanie konfiguracji metadanych nie powiodło się. Sprawdź stan sieci lub konfigurację kontraktu.",
      pt: "Consulta de configuração de metadados falhou. Verifique o status da rede ou configuração do contrato.",
    },
    "Ready to edit metadata.": { de: "Bereit zum Bearbeiten der Metadaten.", es: "Listo para editar los metadatos.", pl: "Gotowe do edycji metadanych.", pt: "Pronto para editar metadados." },
    "Selected metadata fields saved": { de: "Ausgewählte Metadatenfelder gespeichert", es: "Campos de metadatos seleccionados guardados", pl: "Wybrane pola metadanych zapisane", pt: "Campos de metadados selecionados salvos" },
    "Checking metadata service…": { de: "Metadaten-Service wird geprüft…", es: "Comprobando el servicio de metadatos…", pl: "Sprawdzanie usługi metadanych…", pt: "Verificando serviço de metadados…" },
    "Running query…": { de: "Abfrage wird ausgeführt…", es: "Ejecutando consulta…", pl: "Wykonywanie zapytania…", pt: "Executando consulta…" },
    "Select fields above to build a profile update.": { de: "Felder oben auswählen, um ein Profil-Update zu erstellen.", es: "Selecciona campos arriba para crear una actualización de perfil.", pl: "Wybierz pola powyżej, aby zbudować aktualizację profilu.", pt: "Selecione campos acima para criar uma atualização de perfil." },

    "Loading owned domains...": { de: "Eigene Domains werden geladen...", es: "Cargando dominios propios...", pl: "Ładowanie posiadanych domen...", pt: "Carregando domínios próprios..." },
    "Enter a target value": { de: "Einen Zielwert eingeben", es: "Introduce un valor de destino", pl: "Wpisz wartość docelową", pt: "Insira um valor alvo" },
    "Choose an expiry date": { de: "Ein Ablaufdatum wählen", es: "Elige una fecha de vencimiento", pl: "Wybierz datę wygaśnięcia", pt: "Escolha uma data de validade" },
    "Expiry must be in the future": { de: "Ablaufdatum muss in der Zukunft liegen", es: "La fecha de vencimiento debe ser futura", pl: "Data wygaśnięcia musi być w przyszłości", pt: "A data de validade deve ser no futuro" },
    "No record for this domain": { de: "Kein Eintrag für diese Domain", es: "Sin registro para este dominio", pl: "Brak rekordu dla tej domeny", pt: "Nenhum registro para este domínio" },
    "Expiring soon": { de: "Läuft bald ab", es: "Vence pronto", pl: "Wygasa wkrótce", pt: "Expirando em breve" },
    "No expiry": { de: "Kein Ablauf", es: "Sin vencimiento", pl: "Bez wygaśnięcia", pt: "Sem validade" },
    "Revoked": { de: "Widerrufen", es: "Revocado", pl: "Unieważniony", pt: "Revogado" },
    "No record": { de: "Kein Eintrag", es: "Sin registro", pl: "Brak rekordu", pt: "Sem registro" },
    "Manifest copied": { de: "Manifest kopiert", es: "Manifest copiado", pl: "Manifest skopiowany", pt: "Manifesto copiado" },
    "Could not copy manifest": { de: "Manifest konnte nicht kopiert werden", es: "No se pudo copiar el manifiesto", pl: "Nie można skopiować manifestu", pt: "Não foi possível copiar o manifesto" },
    "Loaded dSSL record": { de: "dSSL-Eintrag geladen", es: "Registro dSSL cargado", pl: "Rekord dSSL załadowany", pt: "Registro dSSL carregado" },
    "dSSL config loaded. This page is connected to the production dSSL trust-record contract.": {
      de: "dSSL-Konfiguration geladen. Diese Seite ist mit dem Produktions-dSSL-Vertrauensrekord-Vertrag verbunden.",
      es: "Configuración dSSL cargada. Esta página está conectada al contrato de registros de confianza dSSL de producción.",
      pl: "Konfiguracja dSSL załadowana. Ta strona jest połączona z produkcyjnym kontraktem rekordów zaufania dSSL.",
      pt: "Configuração dSSL carregada. Esta página está conectada ao contrato de registros de confiança dSSL de produção.",
    },
    "dSSL config query failed. Check the contract address or network connection.": {
      de: "dSSL-Konfigurationsabfrage fehlgeschlagen. Prüfe die Vertragsadresse oder Netzwerkverbindung.",
      es: "La consulta de configuración dSSL falló. Comprueba la dirección del contrato o la conexión de red.",
      pl: "Zapytanie konfiguracji dSSL nie powiodło się. Sprawdź adres kontraktu lub połączenie sieciowe.",
      pt: "Consulta de configuração dSSL falhou. Verifique o endereço do contrato ou conexão de rede.",
    },
    "Loading dSSL state...": { de: "dSSL-Status wird geladen...", es: "Cargando estado dSSL...", pl: "Ładowanie stanu dSSL...", pt: "Carregando estado dSSL..." },
    "No attestations found for this domain yet.": {
      de: "Noch keine Attestierungen für diese Domain gefunden.",
      es: "Aún no se encontraron atestaciones para este dominio.",
      pl: "Nie znaleziono jeszcze żadnych atestacji dla tej domeny.",
      pt: "Nenhuma atestação encontrada para este domínio ainda.",
    },
    "Attestations": { de: "Attestierungen", es: "Atestaciones", pl: "Atestacje", pt: "Atestações" },
    "Unknown attestor": { de: "Unbekannter Attestierer", es: "Atestador desconocido", pl: "Nieznany atestujący", pt: "Atestador desconhecido" },
    "No public note provided.": { de: "Kein öffentlicher Hinweis angegeben.", es: "No se proporcionó nota pública.", pl: "Nie podano publicznej notatki.", pt: "Nenhuma nota pública fornecida." },
    "Verified": { de: "Verifiziert", es: "Verificado", pl: "Zweryfikowano", pt: "Verificado" },
    "Verify": { de: "Verifizieren", es: "Verificar", pl: "Weryfikuj", pt: "Verificar" },
    "Trust score": { de: "Vertrauenspunktzahl", es: "Puntuación de confianza", pl: "Punktacja zaufania", pt: "Pontuação de confiança" },
    "Expiry": { de: "Ablauf", es: "Vencimiento", pl: "Wygaśnięcie", pt: "Validade" },
    "Attestors": { de: "Attestierer", es: "Atestadores", pl: "Atestujący", pt: "Atestadores" },
    "Score": { de: "Punktzahl", es: "Puntuación", pl: "Wynik", pt: "Pontuação" },
    "Certificate preview": { de: "Zertifikat-Vorschau", es: "Vista previa del certificado", pl: "Podgląd certyfikatu", pt: "Pré-visualização do certificado" },
    "dSSL certificate": { de: "dSSL-Zertifikat", es: "Certificado dSSL", pl: "Certyfikat dSSL", pt: "Certificado dSSL" },
    "Record management": { de: "Eintragsmanagement", es: "Gestión de registros", pl: "Zarządzanie rekordami", pt: "Gerenciamento de registros" },
    "Publish or update a trust record": { de: "Vertrauenseintrag veröffentlichen oder aktualisieren", es: "Publicar o actualizar un registro de confianza", pl: "Opublikuj lub zaktualizuj rekord zaufania", pt: "Publicar ou atualizar um registro de confiança" },
    "Owned name": { de: "Eigener Name", es: "Nombre propio", pl: "Posiadana nazwa", pt: "Nome próprio" },
    "Load": { de: "Laden", es: "Cargar", pl: "Załaduj", pt: "Carregar" },
    "Target type": { de: "Zieltyp", es: "Tipo de destino", pl: "Typ docelowy", pt: "Tipo de alvo" },
    "Website": { de: "Website", es: "Sitio web", pl: "Strona internetowa", pt: "Website" },
    "Custom": { de: "Benutzerdefiniert", es: "Personalizado", pl: "Niestandardowy", pt: "Personalizado" },
    "Target URI": { de: "Ziel-URI", es: "URI de destino", pl: "URI docelowy", pt: "URI alvo" },
    "Expiry date": { de: "Ablaufdatum", es: "Fecha de vencimiento", pl: "Data wygaśnięcia", pt: "Data de validade" },
    "Publish dSSL record": { de: "dSSL-Eintrag veröffentlichen", es: "Publicar registro dSSL", pl: "Opublikuj rekord dSSL", pt: "Publicar registro dSSL" },
    "Revoke record": { de: "Eintrag widerrufen", es: "Revocar registro", pl: "Unieważnij rekord", pt: "Revogar registro" },
    "Developer manifest": { de: "Entwickler-Manifest", es: "Manifiesto de desarrollador", pl: "Manifest dewelopera", pt: "Manifesto do desenvolvedor" },
    "Add a public trust signal": { de: "Ein öffentliches Vertrauenssignal hinzufügen", es: "Añadir una señal de confianza pública", pl: "Dodaj publiczny sygnał zaufania", pt: "Adicionar sinal de confiança pública" },
    "Submit attestation": { de: "Attestierung einreichen", es: "Enviar atestación", pl: "Wyślij atestację", pt: "Enviar atestação" },
    "Remove": { de: "Entfernen", es: "Eliminar", pl: "Usuń", pt: "Remover" },

    "Select a TLD first": { de: "Zuerst eine TLD auswählen", es: "Selecciona una TLD primero", pl: "Najpierw wybierz TLD", pt: "Selecione uma TLD primeiro" },
    "Enter a price in uatom": { de: "Einen Preis in uatom eingeben", es: "Introduce un precio en uatom", pl: "Wpisz cenę w uatom", pt: "Insira um preço em uatom" },
    "Saving...": { de: "Wird gespeichert...", es: "Guardando...", pl: "Zapisywanie...", pt: "Salvando..." },
    "Settings saved! On-chain fallback + local tier preset updated.": {
      de: "Einstellungen gespeichert! On-chain-Fallback + lokale Tier-Voreinstellung aktualisiert.",
      es: "¡Ajustes guardados! Fallback on-chain + preset de tier local actualizado.",
      pl: "Ustawienia zapisane! Fallback on-chain + lokalne ustawienie tieru zaktualizowane.",
      pt: "Configurações salvas! Fallback on-chain + preset de tier local atualizado.",
    },
    "Make Private": { de: "Privat machen", es: "Hacer privado", pl: "Ustaw jako prywatne", pt: "Tornar privado" },
    "No Policy": { de: "Keine Richtlinie", es: "Sin política", pl: "Brak polityki", pt: "Sem política" },

    "Address copied": { de: "Adresse kopiert", es: "Dirección copiada", pl: "Adres skopiowany", pt: "Endereço copiado" },
    "MOCK MODE ON": { de: "MOCK-MODUS AN", es: "MODO SIMULACIÓN ACTIVADO", pl: "TRYB MOCK WŁĄCZONY", pt: "MODO MOCK ATIVADO" },

    "Share link copied!": { de: "Link zum Teilen kopiert!", es: "¡Enlace compartido copiado!", pl: "Link do udostępniania skopiowany!", pt: "Link de compartilhamento copiado!" },
    "Enter a name or .TLD to search": { de: "Namen oder .TLD zum Suchen eingeben", es: "Introduce un nombre o .TLD para buscar", pl: "Wpisz nazwę lub .TLD do wyszukania", pt: "Insira um nome ou .TLD para pesquisar" },
    "Checking registry...": { de: "Registry wird geprüft...", es: "Comprobando registro...", pl: "Sprawdzanie rejestru...", pt: "Verificando registro..." },
    "Checking resolver...": { de: "Resolver wird geprüft...", es: "Comprobando resolver...", pl: "Sprawdzanie resolvera...", pt: "Verificando resolver..." },
    "Checking dSSL...": { de: "dSSL wird geprüft...", es: "Comprobando dSSL...", pl: "Sprawdzanie dSSL...", pt: "Verificando dSSL..." },
    "Checking marketplace...": { de: "Marktplatz wird geprüft...", es: "Comprobando mercado...", pl: "Sprawdzanie rynku...", pt: "Verificando marketplace..." },
    "Copy search link": { de: "Suchlink kopieren", es: "Copiar enlace de búsqueda", pl: "Kopiuj link wyszukiwania", pt: "Copiar link de pesquisa" },

    "Calculate registration cost": { de: "Registrierungskosten berechnen", es: "Calcular costo de registro", pl: "Oblicz koszt rejestracji", pt: "Calcular custo de registro" },
    "TLD label": { de: "TLD-Bezeichnung", es: "Etiqueta TLD", pl: "Etykieta TLD", pt: "Rótulo TLD" },
    "Compare registration tiers": { de: "Registrierungs-Tiers vergleichen", es: "Comparar niveles de registro", pl: "Porównaj poziomy rejestracji", pt: "Comparar níveis de registro" },
    "Characters": { de: "Zeichen", es: "Caracteres", pl: "Znaki", pt: "Caracteres" },
    "Commit": { de: "Commit", es: "Commit", pl: "Commit", pt: "Commit" },
    "Wait": { de: "Warten", es: "Esperar", pl: "Czekaj", pt: "Aguardar" },
    "Enter a TLD name first": { de: "Zuerst einen TLD-Namen eingeben", es: "Introduce primero un nombre de TLD", pl: "Najpierw wpisz nazwę TLD", pt: "Insira um nome de TLD primeiro" },
    "TLD is too short": { de: "TLD ist zu kurz", es: "El TLD es demasiado corto", pl: "TLD jest za krótka", pt: "TLD é muito curto" },
    "TLD is too long": { de: "TLD ist zu lang", es: "El TLD es demasiado largo", pl: "TLD jest za długa", pt: "TLD é muito longo" },
    "Invalid characters": { de: "Ungültige Zeichen", es: "Caracteres no válidos", pl: "Nieprawidłowe znaki", pt: "Caracteres inválidos" },

    "Explore": { de: "Erkunden", es: "Explorar", pl: "Przeglądaj", pt: "Explorar" },
    "My Listings": { de: "Meine Listings", es: "Mis listados", pl: "Moje oferty", pt: "Meus listados" },
    "Activity": { de: "Aktivität", es: "Actividad", pl: "Aktywność", pt: "Atividade" },
    "Transaction in progress...": { de: "Transaktion läuft...", es: "Transacción en curso...", pl: "Transakcja w toku...", pt: "Transação em andamento..." },
    "Developer tools": { de: "Entwickler-Tools", es: "Herramientas de desarrollador", pl: "Narzędzia dewelopera", pt: "Ferramentas de desenvolvedor" },
    "Filter by type": { de: "Nach Typ filtern", es: "Filtrar por tipo", pl: "Filtruj według typu", pt: "Filtrar por tipo" },
    "Loading marketplace listings...": { de: "Marktplatz-Listings werden geladen...", es: "Cargando listados del mercado...", pl: "Ładowanie ofert rynkowych...", pt: "Carregando listagens do marketplace..." },
    "Something failed": { de: "Etwas ist fehlgeschlagen", es: "Algo falló", pl: "Coś poszło nie tak", pt: "Algo falhou" },
    "Cancel listing": { de: "Listing stornieren", es: "Cancelar listado", pl: "Anuluj ofertę", pt: "Cancelar listagem" },
    "Buy": { de: "Kaufen", es: "Comprar", pl: "Kup", pt: "Comprar" },
    "Fixed price": { de: "Festpreis", es: "Precio fijo", pl: "Stała cena", pt: "Preço fixo" },
    "Your listing": { de: "Dein Listing", es: "Tu listado", pl: "Twoja oferta", pt: "Sua listagem" },
    "Already listed on marketplace": { de: "Bereits im Marktplatz gelistet", es: "Ya listado en el mercado", pl: "Już wystawione na rynku", pt: "Já listado no marketplace" },
    "Owned by your wallet": { de: "Deinem Wallet gehörend", es: "Propiedad de tu wallet", pl: "Należące do Twojego portfela", pt: "De propriedade da sua carteira" },
    "List for sale": { de: "Zum Verkauf anbieten", es: "Poner en venta", pl: "Wystaw na sprzedaż", pt: "Listar para venda" },
    "Make an offer": { de: "Ein Angebot machen", es: "Hacer una oferta", pl: "Złóż ofertę", pt: "Fazer uma oferta" },
    "Accept offer": { de: "Angebot annehmen", es: "Aceptar oferta", pl: "Zaakceptuj ofertę", pt: "Aceitar oferta" },
    "Cancel offer": { de: "Angebot stornieren", es: "Cancelar oferta", pl: "Anuluj ofertę", pt: "Cancelar oferta" },
    "Place bid": { de: "Gebot abgeben", es: "Hacer una puja", pl: "Złóż ofertę cenową", pt: "Fazer lance" },
    "Finalize auction": { de: "Auktion abschließen", es: "Finalizar subasta", pl: "Zakończ aukcję", pt: "Finalizar leilão" },

    "Web3 DNS You Can Browse": { de: "Web3-DNS, das du durchsuchen kannst", es: "DNS Web3 que puedes navegar", pl: "Web3 DNS, który możesz przeglądać", pt: "DNS Web3 que você pode navegar" },
    "Download for Chrome - Free": { de: "Für Chrome herunterladen - Kostenlos", es: "Descargar para Chrome - Gratis", pl: "Pobierz dla Chrome - Bezpłatnie", pt: "Baixar para Chrome - Grátis" },
    "See How It Works": { de: "Sieh, wie es funktioniert", es: "Ver cómo funciona", pl: "Zobacz jak to działa", pt: "Veja como funciona" },
    "No tracking": { de: "Kein Tracking", es: "Sin rastreo", pl: "Bez śledzenia", pt: "Sem rastreamento" },
    "ZIP install": { de: "ZIP-Installation", es: "Instalación ZIP", pl: "Instalacja ZIP", pt: "Instalação ZIP" },
    "Everything You Need. Nothing You Don't.": {
      de: "Alles, was du brauchst. Nichts, was du nicht brauchst.",
      es: "Todo lo que necesitas. Nada que no.",
      pl: "Wszystko, czego potrzebujesz. Nic zbędnego.",
      pt: "Tudo que você precisa. Nada que não.",
    },
    "Download Extension": { de: "Erweiterung herunterladen", es: "Descargar extensión", pl: "Pobierz rozszerzenie", pt: "Baixar extensão" },

    "Route not found": { de: "Route nicht gefunden", es: "Ruta no encontrada", pl: "Trasa nie znaleziona", pt: "Rota não encontrada" },
    "This page got lost in space.": { de: "Diese Seite hat sich im Weltraum verirrt.", es: "Esta página se perdió en el espacio.", pl: "Ta strona zgubiła się w przestrzeni.", pt: "Esta página se perdeu no espaço." },
    "The address you are looking for does not exist or has been moved. The internet is pretending to be a maze again, but you can safely return to base.": {
      de: "Die gesuchte Adresse existiert nicht oder wurde verschoben. Das Internet gibt wieder vor, ein Labyrinth zu sein, aber du kannst sicher zurück zur Basis.",
      es: "La dirección que buscas no existe o se ha movido. Internet está fingiendo ser un laberinto otra vez, pero puedes volver a la base con seguridad.",
      pl: "Szukany adres nie istnieje lub został przeniesiony. Internet znowu udaje labirynt, ale możesz bezpiecznie wrócić do bazy.",
      pt: "O endereço que você está procurando não existe ou foi movido. A internet está fingindo ser um labirinto novamente, mas você pode retornar com segurança.",
    },
    "Back to Home": { de: "Zurück zur Startseite", es: "Volver al inicio", pl: "Powrót do strony głównej", pt: "Voltar ao início" },
    "Previous Page": { de: "Vorherige Seite", es: "Página anterior", pl: "Poprzednia strona", pt: "Página anterior" },

    "Mint a TLD": { de: "TLD minten", es: "Acuñar un TLD", pl: "Mintuj TLD", pt: "Criar TLD" },
    "Register a TLD namespace": { de: "TLD-Namespace registrieren", es: "Registrar un namespace TLD", pl: "Zarejestruj przestrzeń nazw TLD", pt: "Registrar um namespace TLD" },
    "Check availability, commit on-chain, wait the required delay, then register your permanent namespace.": {
      de: "Prüfe die Verfügbarkeit, bestätige on-chain, warte die erforderliche Verzögerung, dann registriere deinen dauerhaften Namespace.",
      es: "Comprueba la disponibilidad, confirma on-chain, espera el retraso requerido, luego registra tu namespace permanente.",
      pl: "Sprawdź dostępność, zatwierdź on-chain, poczekaj wymagany czas, a następnie zarejestruj swój stały namespace.",
      pt: "Verifique a disponibilidade, confirme on-chain, aguarde o atraso necessário, depois registre seu namespace permanente.",
    },
    "Namespace label": { de: "Namespace-Bezeichnung", es: "Etiqueta de namespace", pl: "Etykieta namespace", pt: "Rótulo de namespace" },
    "Check namespace": { de: "Namespace prüfen", es: "Comprobar namespace", pl: "Sprawdź namespace", pt: "Verificar namespace" },
    "Secure commit": { de: "Sicherer Commit", es: "Commit seguro", pl: "Bezpieczny commit", pt: "Commit seguro" },
    "Submit a hidden commitment on-chain. This prevents front-running your registration.": {
      de: "Sende eine versteckte Verpflichtung on-chain. Dies verhindert Front-Running bei deiner Registrierung.",
      es: "Envía un compromiso oculto on-chain. Esto evita el front-running en tu registro.",
      pl: "Wyślij ukryte zobowiązanie on-chain. Zapobiega to front-runningowi Twojej rejestracji.",
      pt: "Envie um compromisso oculto on-chain. Isso evita front-running no seu registro.",
    },
    "Waiting period": { de: "Wartezeit", es: "Período de espera", pl: "Okres oczekiwania", pt: "Período de espera" },
    "Commit confirmed - please wait": { de: "Commit bestätigt - bitte warten", es: "Commit confirmado - por favor espera", pl: "Commit potwierdzony - prosimy czekać", pt: "Commit confirmado - por favor aguarde" },
    "The contract requires a minimum delay before you can complete registration.": {
      de: "Der Vertrag erfordert eine Mindest-Verzögerung, bevor du die Registrierung abschließen kannst.",
      es: "El contrato requiere un retraso mínimo antes de que puedas completar el registro.",
      pl: "Kontrakt wymaga minimalnego opóźnienia przed ukończeniem rejestracji.",
      pt: "O contrato exige um atraso mínimo antes que você possa concluir o registro.",
    },
    "Ready to register": { de: "Bereit zur Registrierung", es: "Listo para registrar", pl: "Gotowe do rejestracji", pt: "Pronto para registrar" },
    "Your commit has matured. Sign the final registration transaction to claim your TLD.": {
      de: "Dein Commit ist gereift. Unterzeichne die finale Registrierungstransaktion, um deine TLD zu beanspruchen.",
      es: "Tu commit ha madurado. Firma la transacción de registro final para reclamar tu TLD.",
      pl: "Twój commit dojrzał. Podpisz ostateczną transakcję rejestracji, aby odebrać swoją TLD.",
      pt: "Seu commit amadureceu. Assine a transação de registro final para reivindicar sua TLD.",
    },
    "Register namespace": { de: "Namespace registrieren", es: "Registrar namespace", pl: "Zarejestruj namespace", pt: "Registrar namespace" },

    "DID Identity": { de: "DID-Identität", es: "Identidad DID", pl: "Tożsamość DID", pt: "Identidade DID" },
    "Your domain's decentralized identifier - W3C did:cosmos standard, resolvable globally.": {
      de: "Der dezentralisierte Identifikator deiner Domain - W3C-Standard did:cosmos, global auflösbar.",
      es: "El identificador descentralizado de tu dominio - estándar W3C did:cosmos, resoluble globalmente.",
      pl: "Zdecentralizowany identyfikator Twojej domeny - standard W3C did:cosmos, rozwiązywalny globalnie.",
      pt: "O identificador descentralizado do seu domínio - padrão W3C did:cosmos, resolvível globalmente.",
    },
    "Canonical DID": { de: "Kanonisches DID", es: "DID canónico", pl: "Kanoniczne DID", pt: "DID canônico" },
    "Alias": { de: "Alias", es: "Alias", pl: "Alias", pt: "Alias" },
    "DID Document": { de: "DID-Dokument", es: "Documento DID", pl: "Dokument DID", pt: "Documento DID" },
    "Open in resolver": { de: "Im Resolver öffnen", es: "Abrir en resolver", pl: "Otwórz w resolverze", pt: "Abrir no resolver" },
    "DNS record type": { de: "DNS-Eintragstyp", es: "Tipo de registro DNS", pl: "Typ rekordu DNS", pt: "Tipo de registro DNS" },

    "On-Chain Page Builder": { de: "On-Chain-Seitenersteller", es: "Creador de páginas on-chain", pl: "Kreator stron on-chain", pt: "Construtor de páginas on-chain" },
    "Build your Web3 profile": { de: "Erstelle dein Web3-Profil", es: "Crea tu perfil Web3", pl: "Zbuduj swój profil Web3", pt: "Construa seu perfil Web3" },
    "Save Your Page": { de: "Seite speichern", es: "Guardar tu página", pl: "Zapisz swoją stronę", pt: "Salvar sua página" },
    "Save to Computer": { de: "Auf Computer speichern", es: "Guardar en el ordenador", pl: "Zapisz na komputerze", pt: "Salvar no computador" },
    "Deploy to Cosmos Hub": { de: "Auf Cosmos Hub deployen", es: "Desplegar en Cosmos Hub", pl: "Wdróż na Cosmos Hub", pt: "Implantar no Cosmos Hub" },
    "Deployed!": { de: "Deployed!", es: "¡Desplegado!", pl: "Wdrożono!", pt: "Implantado!" },
    "Copy profile URL": { de: "Profil-URL kopieren", es: "Copiar URL del perfil", pl: "Kopiuj URL profilu", pt: "Copiar URL do perfil" },
    "Identity": { de: "Identität", es: "Identidad", pl: "Tożsamość", pt: "Identidade" },
    "Display Name": { de: "Anzeigename", es: "Nombre de pantalla", pl: "Wyświetlana nazwa", pt: "Nome de exibição" },
    "Bio": { de: "Bio", es: "Bio", pl: "Bio", pt: "Bio" },
    "Quality": { de: "Qualität", es: "Calidad", pl: "Jakość", pt: "Qualidade" },
    "Skills & Tags": { de: "Fähigkeiten & Tags", es: "Habilidades y etiquetas", pl: "Umiejętności i tagi", pt: "Habilidades e tags" },
    "Color Scheme": { de: "Farbschema", es: "Esquema de color", pl: "Schemat kolorów", pt: "Esquema de cores" },
    "Font Style": { de: "Schriftstil", es: "Estilo de fuente", pl: "Styl czcionki", pt: "Estilo de fonte" },
    "Extra Sections": { de: "Zusätzliche Abschnitte", es: "Secciones adicionales", pl: "Dodatkowe sekcje", pt: "Seções extras" },
    "Add Section": { de: "Abschnitt hinzufügen", es: "Añadir sección", pl: "Dodaj sekcję", pt: "Adicionar seção" },
    "Add Link": { de: "Link hinzufügen", es: "Añadir enlace", pl: "Dodaj link", pt: "Adicionar link" },
    "Connect Wallet to Deploy": { de: "Wallet verbinden zum Deployen", es: "Conectar wallet para desplegar", pl: "Połącz portfel, aby wdrożyć", pt: "Conectar carteira para implantar" },

    "Atom Registry Pay": { de: "Atom Registry Pay", es: "Atom Registry Pay", pl: "Atom Registry Pay", pt: "Atom Registry Pay" },
    "Send crypto to names, not wallet addresses.": {
      de: "Sende Krypto an Namen, nicht an Wallet-Adressen.",
      es: "Envía cripto a nombres, no a direcciones de wallet.",
      pl: "Wysyłaj krypto do nazw, nie do adresów portfeli.",
      pt: "Envie cripto para nomes, não para endereços de carteira."
    },
    "Scan. Resolve. Pay.": {
      de: "Scannen. Auflösen. Bezahlen.",
      es: "Escanea. Resuelve. Paga.",
      pl: "Skanuj. Rozwiąż. Zapłać.",
      pt: "Escaneie. Resolva. Pague."
    },
    "Try Atom Registry Pay": {
      de: "Atom Registry Pay testen",
      es: "Probar Atom Registry Pay",
      pl: "Wypróbuj Atom Registry Pay",
      pt: "Experimentar Atom Registry Pay"
    },
    "Create Payment QR": {
      de: "Zahlungs-QR erstellen",
      es: "Crear QR de pago",
      pl: "Utwórz kod QR płatności",
      pt: "Criar QR de pagamento"
    },
    "Payments": { de: "Zahlungen", es: "Pagos", pl: "Płatności", pt: "Pagamentos" },
    "Turn any Atom Registry name into a scannable payment identity.": {
      de: "Verwandle jeden Atom Registry-Namen in eine scannbare Zahlungsidentität.",
      es: "Convierte cualquier nombre de Atom Registry en una identidad de pago escaneable.",
      pl: "Zamień dowolną nazwę Atom Registry w skanowalną tożsamość płatniczą.",
      pt: "Transforme qualquer nome Atom Registry numa identidade de pagamento digitalizável."
    },
    "Confirm and sign with wallet": {
      de: "Bestätigen und mit Wallet signieren",
      es: "Confirmar y firmar con la wallet",
      pl: "Potwierdź i podpisz portfelem",
      pt: "Confirmar e assinar com a carteira"
    },
    "Show QR": { de: "QR anzeigen", es: "Mostrar QR", pl: "Pokaż QR", pt: "Mostrar QR" },
    "Copy pay link": { de: "Zahlungs-Link kopieren", es: "Copiar enlace de pago", pl: "Kopiuj link płatności", pt: "Copiar link de pagamento" },
    "Download QR": { de: "QR herunterladen", es: "Descargar QR", pl: "Pobierz QR", pt: "Baixar QR" },
    "Recipient name": { de: "Empfängername", es: "Nombre del destinatario", pl: "Nazwa odbiorcy", pt: "Nome do destinatário" },
    "Resolved address": { de: "Aufgelöste Adresse", es: "Dirección resuelta", pl: "Rozwiązany adres", pt: "Endereço resolvido" },
    "Chain": { de: "Chain", es: "Cadena", pl: "Sieć", pt: "Cadeia" },
    "Denom": { de: "Denom", es: "Denom", pl: "Denom", pt: "Denom" },
    "Memo": { de: "Memo", es: "Memo", pl: "Memo", pt: "Memo" },
    "Amount": { de: "Betrag", es: "Cantidad", pl: "Kwota", pt: "Valor" },
    "Open intent": { de: "Intent öffnen", es: "Abrir intent", pl: "Otwórz intencję", pt: "Abrir intent" },
    "Look up this name": { de: "Diesen Namen nachschlagen", es: "Buscar este nombre", pl: "Sprawdź tę nazwę", pt: "Procurar este nome" },
    "Back": { de: "Zurück", es: "Atrás", pl: "Wstecz", pt: "Voltar" },
    "Minimum amount is 0.01 ATOM.": {
      de: "Der Mindestbetrag beträgt 0,01 ATOM.",
      es: "La cantidad mínima es de 0,01 ATOM.",
      pl: "Minimalna kwota to 0,01 ATOM.",
      pt: "O valor mínimo é 0,01 ATOM."
    },
    "Amount is not a valid number.": {
      de: "Der Betrag ist keine gültige Zahl.",
      es: "La cantidad no es un número válido.",
      pl: "Kwota nie jest prawidłową liczbą.",
      pt: "O valor não é um número válido."
    },
    "Change amount": {
      de: "Betrag ändern",
      es: "Cambiar cantidad",
      pl: "Zmień kwotę",
      pt: "Alterar valor"
    },
    "What is Atom Registry Pay": {
      de: "Was ist Atom Registry Pay",
      es: "Qué es Atom Registry Pay",
      pl: "Czym jest Atom Registry Pay",
      pt: "O que é o Atom Registry Pay"
    },
    "Receive payments by default": {
      de: "Standardmäßig Zahlungen empfangen",
      es: "Recibir pagos por defecto",
      pl: "Domyślne odbieranie płatności",
      pt: "Receber pagamentos por padrão"
    },
    "Send a payment": {
      de: "Eine Zahlung senden",
      es: "Enviar un pago",
      pl: "Wyślij płatność",
      pt: "Enviar um pagamento"
    },
    "QR codes & Receive page": {
      de: "QR-Codes & Empfangs-Seite",
      es: "Códigos QR y página de recepción",
      pl: "Kody QR i strona odbioru",
      pt: "Códigos QR e página de recebimento"
    },
    "Safety checks": {
      de: "Sicherheitsprüfungen",
      es: "Comprobaciones de seguridad",
      pl: "Zabezpieczenia",
      pt: "Verificações de segurança"
    },
    "FAQ & troubleshooting": {
      de: "FAQ & Fehlerbehebung",
      es: "FAQ y resolución de problemas",
      pl: "FAQ i rozwiązywanie problemów",
      pt: "FAQ e solução de problemas"
    },
    "Share your receive QR": {
      de: "Empfangs-QR teilen",
      es: "Comparte tu QR de recepción",
      pl: "Udostępnij swój QR odbioru",
      pt: "Compartilhe o seu QR de recebimento"
    },
    "Invoice-style links": {
      de: "Rechnungs-Stil-Links",
      es: "Enlaces tipo factura",
      pl: "Linki w stylu faktury",
      pt: "Links tipo fatura"
    },
    "Resolved-address preview": {
      de: "Aufgelöste-Adresse-Vorschau",
      es: "Vista previa de dirección resuelta",
      pl: "Podgląd rozwiązanego adresu",
      pt: "Pré-visualização do endereço resolvido"
    },
    "Address-change warning": {
      de: "Adresswechsel-Warnung",
      es: "Aviso de cambio de dirección",
      pl: "Ostrzeżenie o zmianie adresu",
      pt: "Aviso de mudança de endereço"
    },
    "Source badge": {
      de: "Quellen-Badge",
      es: "Insignia de origen",
      pl: "Plakietka źródła",
      pt: "Selo de origem"
    },
    "Amount validation": {
      de: "Betragsvalidierung",
      es: "Validación del monto",
      pl: "Walidacja kwoty",
      pt: "Validação do valor"
    },
    "QR cannot auto-send": {
      de: "QR kann nicht automatisch senden",
      es: "El QR no puede enviar automáticamente",
      pl: "Kod QR nie wysyła automatycznie",
      pt: "QR não pode enviar automaticamente"
    },
    "Rotating a payment address": {
      de: "Zahlungsadresse wechseln",
      es: "Rotar una dirección de pago",
      pl: "Zmiana adresu płatności",
      pt: "Trocar um endereço de pagamento"
    },
    "Receive page": {
      de: "Empfangs-Seite",
      es: "Página de recepción",
      pl: "Strona odbioru",
      pt: "Página de recebimento"
    },

    "Own a name. Receive payments.": {
      de: "Besitze einen Namen. Erhalte Zahlungen.",
      es: "Ten un nombre. Recibe pagos.",
      pl: "Posiadaj nazwę. Odbieraj płatności.",
      pt: "Tenha um nome. Receba pagamentos."
    },
    "Every Atom Registry name is a payment identity.": {
      de: "Jeder Atom Registry-Name ist eine Zahlungsidentität.",
      es: "Cada nombre de Atom Registry es una identidad de pago.",
      pl: "Każda nazwa Atom Registry jest tożsamością płatniczą.",
      pt: "Cada nome Atom Registry é uma identidade de pagamento."
    },
    "Recipient confirmed by Atom Registry - verified on-chain before signing.": {
      de: "Empfänger durch Atom Registry bestätigt - on-chain überprüft vor dem Signieren.",
      es: "Destinatario confirmado por Atom Registry - verificado on-chain antes de firmar.",
      pl: "Odbiorca potwierdzony przez Atom Registry - zweryfikowany on-chain przed podpisaniem.",
      pt: "Destinatário confirmado pelo Atom Registry - verificado on-chain antes de assinar."
    },
    "This name resolved to a different address than last time.": {
      de: "Dieser Name wurde zu einer anderen Adresse aufgelöst als beim letzten Mal.",
      es: "Este nombre se resolvió en una dirección diferente que la última vez.",
      pl: "Ta nazwa została rozwiązana do innego adresu niż poprzednio.",
      pt: "Este nome foi resolvido para um endereço diferente da última vez."
    },
    "Verify before sending.": { de: "Vor dem Senden überprüfen.", es: "Verifica antes de enviar.", pl: "Zweryfikuj przed wysłaniem.", pt: "Verifique antes de enviar." },
    "Previous:": { de: "Vorher:", es: "Anterior:", pl: "Poprzedni:", pt: "Anterior:" },
    "Current:": { de: "Aktuell:", es: "Actual:", pl: "Aktualny:", pt: "Atual:" },
    "Payment intent, not wallet address": {
      de: "Zahlungs-Intent, keine Wallet-Adresse",
      es: "Intención de pago, no dirección de wallet",
      pl: "Intencja płatności, nie adres portfela",
      pt: "Intenção de pagamento, não endereço de carteira"
    },
    "This QR opens:": { de: "Dieser QR öffnet:", es: "Este QR abre:", pl: "Ten QR otwiera:", pt: "Este QR abre:" },
    "Enter an amount of at least 0.01 ATOM to continue.": {
      de: "Gib mindestens 0,01 ATOM ein, um fortzufahren.",
      es: "Introduce al menos 0,01 ATOM para continuar.",
      pl: "Wpisz co najmniej 0,01 ATOM, aby kontynuować.",
      pt: "Insira pelo menos 0,01 ATOM para continuar."
    },
    "Custom payment routing": {
      de: "Benutzerdefiniertes Zahlungsrouting",
      es: "Enrutamiento de pago personalizado",
      pl: "Niestandardowe trasowanie płatności",
      pt: "Roteamento de pagamento personalizado"
    },
    "Share this QR to receive ATOM by name. Payments sent to this name will resolve through Atom Registry.": {
      de: "Teile diesen QR, um ATOM nach Namen zu erhalten. Zahlungen werden über Atom Registry aufgelöst.",
      es: "Comparte este QR para recibir ATOM por nombre. Los pagos se resolverán a través de Atom Registry.",
      pl: "Udostępnij ten QR, aby otrzymywać ATOM po nazwie. Płatności są rozwiązywane przez Atom Registry.",
      pt: "Compartilhe este QR para receber ATOM pelo nome. Os pagamentos resolverão através do Atom Registry."
    },
    "Switch to Send mode": { de: "Zu Senden-Modus wechseln", es: "Cambiar a modo Enviar", pl: "Przełącz na tryb Wysyłania", pt: "Mudar para modo Enviar" },
    "Copy payment link": { de: "Zahlungs-Link kopieren", es: "Copiar enlace de pago", pl: "Kopiuj link płatności", pt: "Copiar link de pagamento" },
    "Copy resolved address": { de: "Aufgelöste Adresse kopieren", es: "Copiar dirección resuelta", pl: "Kopiuj rozwiązany adres", pt: "Copiar endereço resolvido" },
    "Payment uses configured payment metadata.": {
      de: "Zahlung verwendet konfigurierte Zahlungs-Metadaten.",
      es: "El pago utiliza los metadatos de pago configurados.",
      pl: "Płatność używa skonfigurowanych metadanych płatności.",
      pt: "O pagamento utiliza os metadados de pagamento configurados."
    },
    "Payment uses domain owner address. The owner can add payment metadata to route to a different wallet.": {
      de: "Zahlung verwendet die Adresse des Domain-Inhabers. Der Inhaber kann Zahlungs-Metadaten hinzufügen, um an eine andere Wallet zu leiten.",
      es: "El pago utiliza la dirección del propietario del dominio. El propietario puede añadir metadatos de pago para enrutar a otra wallet.",
      pl: "Płatność używa adresu właściciela domeny. Właściciel może dodać metadane płatności, aby kierować do innego portfela.",
      pt: "O pagamento utiliza o endereço do proprietário do domínio. O proprietário pode adicionar metadados de pagamento para encaminhar para outra carteira."
    },

    "Source": { de: "Quelle", es: "Origen", pl: "Źródło", pt: "Origem" },
    "Payment metadata": { de: "Zahlungs-Metadaten", es: "Metadatos de pago", pl: "Metadane płatności", pt: "Metadados de pagamento" },
    "Domain owner": { de: "Domain-Inhaber", es: "Propietario del dominio", pl: "Właściciel domeny", pt: "Proprietário do domínio" },
    "No payment address is configured for this name. Using the domain owner address instead.": {
      de: "Für diesen Namen ist keine Zahlungsadresse konfiguriert. Stattdessen wird die Adresse des Domain-Inhabers verwendet.",
      es: "Este nombre no tiene una dirección de pago configurada. Se usará la dirección del propietario del dominio.",
      pl: "Dla tej nazwy nie skonfigurowano adresu płatności. Użyto adresu właściciela domeny.",
      pt: "Este nome não tem endereço de pagamento configurado. Usando o endereço do proprietário do domínio."
    },
    "No payment address or owner address could be resolved for this name.": {
      de: "Für diesen Namen konnten weder eine Zahlungsadresse noch eine Inhaberadresse aufgelöst werden.",
      es: "No se pudo resolver una dirección de pago ni de propietario para este nombre.",
      pl: "Nie udało się rozwiązać adresu płatności ani adresu właściciela dla tej nazwy.",
      pt: "Não foi possível resolver nenhum endereço de pagamento ou de proprietário para este nome."
    },

    "Pay": { de: "Bezahlen", es: "Pagar", pl: "Płać", pt: "Pagar" },
    "Pay QR": { de: "Zahlungs-QR", es: "QR de pago", pl: "QR płatności", pt: "QR de pagamento" },
    "Send ATOM": { de: "ATOM senden", es: "Enviar ATOM", pl: "Wyślij ATOM", pt: "Enviar ATOM" },
    "Show payment QR": { de: "Zahlungs-QR anzeigen", es: "Mostrar QR de pago", pl: "Pokaż kod QR płatności", pt: "Mostrar QR de pagamento" },
    "Copy address": { de: "Adresse kopieren", es: "Copiar dirección", pl: "Kopiuj adres", pt: "Copiar endereço" },
    "Copy link": { de: "Link kopieren", es: "Copiar enlace", pl: "Kopiuj link", pt: "Copiar link" },
    "Payment metadata is not configured yet.": {
      de: "Zahlungs-Metadaten sind noch nicht konfiguriert.",
      es: "Los metadatos de pago aún no están configurados.",
      pl: "Metadane płatności nie są jeszcze skonfigurowane.",
      pt: "Os metadados de pagamento ainda não estão configurados."
    },
    "Add payment metadata": {
      de: "Zahlungs-Metadaten hinzufügen",
      es: "Añadir metadatos de pago",
      pl: "Dodaj metadane płatności",
      pt: "Adicionar metadados de pagamento"
    },
    "Open profile": { de: "Profil öffnen", es: "Abrir perfil", pl: "Otwórz profil", pt: "Abrir perfil" },
    "Send payment": { de: "Zahlung senden", es: "Enviar pago", pl: "Wyślij płatność", pt: "Enviar pagamento" },
    "View registry record": { de: "Registry-Eintrag anzeigen", es: "Ver registro", pl: "Pokaż wpis rejestru", pt: "Ver registro" },
    "Open website": { de: "Webseite öffnen", es: "Abrir sitio web", pl: "Otwórz stronę", pt: "Abrir site" },
    "Copy resolved wallet address": {
      de: "Aufgelöste Wallet-Adresse kopieren",
      es: "Copiar dirección de wallet resuelta",
      pl: "Kopiuj rozwiązany adres portfela",
      pt: "Copiar endereço de carteira resolvido"
    },
    "Smart QR resolver": {
      de: "Smart-QR-Resolver",
      es: "Resolutor QR inteligente",
      pl: "Inteligentny resolver QR",
      pt: "Resolvedor QR inteligente"
    },
    "Resolve": { de: "Auflösen", es: "Resolver", pl: "Rozwiąż", pt: "Resolver" },
    "Hide QR": { de: "QR ausblenden", es: "Ocultar QR", pl: "Ukryj QR", pt: "Ocultar QR" },
    "Lookup": { de: "Nachschlagen", es: "Buscar", pl: "Sprawdź", pt: "Procurar" },

    "Pending": { de: "Wartet", es: "Pendiente", pl: "Oczekuje", pt: "Pendente" },
    "Awaiting signature…": {
      de: "Warten auf Signatur…",
      es: "Esperando firma…",
      pl: "Oczekiwanie na podpis…",
      pt: "Aguardando assinatura…"
    },
    "Saved": { de: "Gespeichert", es: "Guardado", pl: "Zapisane", pt: "Salvo" },
    "Failed": { de: "Fehlgeschlagen", es: "Fallido", pl: "Nieudane", pt: "Falhou" },
    "Skipped": { de: "Übersprungen", es: "Omitido", pl: "Pominięte", pt: "Ignorado" },

    "Every recipient is resolved on-chain through Atom Registry before your wallet signs anything - no addresses to memorize, no copy-paste mistakes.": {
      de: "Jeder Empfänger wird vor der Signatur deiner Wallet on-chain über Atom Registry aufgelöst - keine Adressen zum Merken, keine Copy-Paste-Fehler.",
      es: "Cada destinatario se resuelve on-chain a través de Atom Registry antes de que tu wallet firme nada - sin direcciones que memorizar y sin errores de copiar y pegar.",
      pl: "Każdy odbiorca jest rozwiązywany on-chain przez Atom Registry, zanim Twój portfel cokolwiek podpisze - bez zapamiętywania adresów i bez błędów przy kopiowaniu.",
      pt: "Cada destinatário é resolvido on-chain através do Atom Registry antes de a tua carteira assinar - sem endereços para memorizar nem erros de copy-paste."
    },
    "Memo (optional)": {
      de: "Memo (optional)",
      es: "Memo (opcional)",
      pl: "Memo (opcjonalne)",
      pt: "Memo (opcional)"
    },
    "What's live on your domain": {
      de: "Was auf deiner Domain veröffentlicht ist",
      es: "Lo que está activo en tu dominio",
      pl: "Co jest opublikowane na Twojej domenie",
      pt: "O que está ativo no teu domínio"
    },
    "These fields are visible to anyone who looks up your domain. Edit or remove them below.": {
      de: "Diese Felder sind für jeden sichtbar, der deine Domain abfragt. Bearbeite oder entferne sie unten.",
      es: "Estos campos son visibles para cualquiera que consulte tu dominio. Edítalos o elimínalos abajo.",
      pl: "Te pola są widoczne dla każdego, kto wyszuka Twoją domenę. Edytuj lub usuń je poniżej.",
      pt: "Estes campos são visíveis a qualquer pessoa que consulte o teu domínio. Edita-os ou remove-os abaixo."
    },
    "Edit": { de: "Bearbeiten", es: "Editar", pl: "Edytuj", pt: "Editar" },
    "Delete": { de: "Löschen", es: "Eliminar", pl: "Usuń", pt: "Eliminar" },
    "New recipient - verify the address with the recipient before sending.": {
      de: "Neuer Empfänger - prüfe die Adresse vor dem Senden mit dem Empfänger.",
      es: "Nuevo destinatario: verifica la dirección con el destinatario antes de enviar.",
      pl: "Nowy odbiorca - zweryfikuj adres z odbiorcą przed wysłaniem.",
      pt: "Novo destinatário - verifica o endereço com o destinatário antes de enviar."
    },
    "Address verified": {
      de: "Adresse verifiziert",
      es: "Dirección verificada",
      pl: "Adres zweryfikowany",
      pt: "Endereço verificado"
    },
    "I understand the address has changed and want to continue.": {
      de: "Ich verstehe, dass sich die Adresse geändert hat, und möchte fortfahren.",
      es: "Entiendo que la dirección ha cambiado y quiero continuar.",
      pl: "Rozumiem, że adres się zmienił i chcę kontynuować.",
      pt: "Compreendo que o endereço foi alterado e quero continuar."
    },
    "Reset trust (advanced)": {
      de: "Vertrauen zurücksetzen (erweitert)",
      es: "Restablecer confianza (avanzado)",
      pl: "Zresetuj zaufanie (zaawansowane)",
      pt: "Repor confiança (avançado)"
    },
    "This name resolved to a different address than last time.": {
      de: "Dieser Name wurde zu einer anderen Adresse aufgelöst als beim letzten Mal.",
      es: "Este nombre se resolvió a una dirección diferente que la última vez.",
      pl: "Ta nazwa została rozwiązana do innego adresu niż poprzednio.",
      pt: "Este nome foi resolvido para um endereço diferente da última vez."
    },
    "Hidden by recipient - your wallet shows it before signing": {
      de: "Vom Empfänger ausgeblendet - deine Wallet zeigt sie vor dem Signieren an",
      es: "Oculto por el destinatario - tu wallet lo muestra antes de firmar",
      pl: "Ukryte przez odbiorcę - Twój portfel pokaże adres przed podpisaniem",
      pt: "Ocultado pelo destinatário - a tua carteira mostra-o antes de assinares"
    },
    "Hidden by recipient - revealed in sender wallet at sign time": {
      de: "Vom Empfänger ausgeblendet - wird beim Signieren in der Sender-Wallet angezeigt",
      es: "Oculto por el destinatario - se muestra en la wallet del remitente al firmar",
      pl: "Ukryte przez odbiorcę - widoczne w portfelu wysyłającego przy podpisywaniu",
      pt: "Ocultado pelo destinatário - revelado na carteira do remetente ao assinar"
    },
    "Amount to send (ATOM)": {
      de: "Zu sendender Betrag (ATOM)",
      es: "Cantidad a enviar (ATOM)",
      pl: "Kwota do wysłania (ATOM)",
      pt: "Valor a enviar (ATOM)"
    },
    "Atom Registry Pay never auto-sends funds. Every transaction requires explicit wallet confirmation.": {
      de: "Atom Registry Pay sendet niemals automatisch Mittel. Jede Transaktion erfordert eine ausdrückliche Wallet-Bestätigung.",
      es: "Atom Registry Pay nunca envía fondos automáticamente. Cada transacción requiere confirmación explícita de la wallet.",
      pl: "Atom Registry Pay nigdy nie wysyła środków automatycznie. Każda transakcja wymaga wyraźnego potwierdzenia w portfelu.",
      pt: "O Atom Registry Pay nunca envia fundos automaticamente. Cada transação exige confirmação explícita da carteira."
    },

    "Amount (min. 0.01 ATOM)": {
      de: "Betrag (min. 0,01 ATOM)",
      es: "Cantidad (mín. 0,01 ATOM)",
      pl: "Kwota (min. 0,01 ATOM)",
      pt: "Valor (mín. 0,01 ATOM)"
    },
    "min. 0.01 ATOM": {
      de: "min. 0,01 ATOM",
      es: "mín. 0,01 ATOM",
      pl: "min. 0,01 ATOM",
      pt: "mín. 0,01 ATOM"
    },

    "How it works": {
      de: "So funktioniert es",
      es: "Cómo funciona",
      pl: "Jak to działa",
      pt: "Como funciona"
    },
    "What you can do with a pay link": {
      de: "Was du mit einem Zahlungs-Link tun kannst",
      es: "Qué puedes hacer con un enlace de pago",
      pl: "Co możesz zrobić z linkiem płatności",
      pt: "O que podes fazer com um link de pagamento"
    },
    "First-time questions": {
      de: "Erste Fragen",
      es: "Preguntas para empezar",
      pl: "Pytania na początek",
      pt: "Perguntas para começar"
    },

    "From a name to a signed transaction - in three steps.": {
      de: "Vom Namen zur signierten Transaktion - in drei Schritten.",
      es: "Del nombre a una transacción firmada, en tres pasos.",
      pl: "Od nazwy do podpisanej transakcji - w trzech krokach.",
      pt: "De um nome a uma transação assinada - em três passos."
    },
    "One link, many ways to receive ATOM.": {
      de: "Ein Link, viele Wege, ATOM zu empfangen.",
      es: "Un enlace, muchas formas de recibir ATOM.",
      pl: "Jeden link, wiele sposobów odbioru ATOM.",
      pt: "Um link, várias maneiras de receber ATOM."
    },
    "Quick answers before you send.": {
      de: "Schnelle Antworten, bevor du sendest.",
      es: "Respuestas rápidas antes de enviar.",
      pl: "Szybkie odpowiedzi, zanim wyślesz.",
      pt: "Respostas rápidas antes de enviar."
    },

    "No wallet addresses to copy, no chains to pick by hand. The interface handles resolution; your wallet keeps the final say.": {
      de: "Keine Wallet-Adressen zum Kopieren, keine Chains zum manuellen Auswählen. Die Oberfläche übernimmt die Auflösung; deine Wallet behält das letzte Wort.",
      es: "Sin direcciones de wallet que copiar ni cadenas que elegir a mano. La interfaz se encarga de la resolución; tu wallet tiene la última palabra.",
      pl: "Bez kopiowania adresów portfela, bez ręcznego wybierania sieci. Interfejs zajmuje się rozwiązaniem; ostatnie słowo zawsze należy do Twojego portfela.",
      pt: "Sem endereços de carteira para copiar nem cadeias para escolher à mão. A interface trata da resolução; a tua carteira tem a última palavra."
    },
    "Once you generate a link for your name, it works the same everywhere - chat, invoice, poster, storefront.": {
      de: "Sobald du einen Link für deinen Namen erzeugst, funktioniert er überall gleich - Chat, Rechnung, Poster, Schaufenster.",
      es: "Una vez que generas un enlace para tu nombre, funciona igual en cualquier lugar: chat, factura, póster o escaparate.",
      pl: "Po wygenerowaniu linku dla swojej nazwy działa wszędzie tak samo - w czacie, na fakturze, na plakacie, w sklepie.",
      pt: "Depois de gerar um link para o teu nome, funciona da mesma forma em todo o lado - chat, fatura, cartaz ou loja."
    },

    "Enter or open a name": {
      de: "Namen eingeben oder öffnen",
      es: "Introduce o abre un nombre",
      pl: "Wpisz lub otwórz nazwę",
      pt: "Insere ou abre um nome"
    },
    "Open a payment link someone shared with you, or type a registered Atom Registry name such as": {
      de: "Öffne einen Zahlungs-Link, den jemand mit dir geteilt hat, oder gib einen registrierten Atom Registry-Namen ein, zum Beispiel",
      es: "Abre un enlace de pago que alguien haya compartido contigo o escribe un nombre registrado de Atom Registry, como",
      pl: "Otwórz link płatności udostępniony przez kogoś lub wpisz zarejestrowaną nazwę Atom Registry, na przykład",
      pt: "Abre um link de pagamento que alguém partilhou contigo ou escreve um nome registado do Atom Registry, como"
    },
    "We resolve it on-chain": {
      de: "Wir lösen ihn on-chain auf",
      es: "Lo resolvemos on-chain",
      pl: "Rozwiązujemy ją on-chain",
      pt: "Resolvemos on-chain"
    },
    "Atom Registry reads the recipient's payment metadata directly from the blockchain - chain, denom and address are verified live before anything is prepared.": {
      de: "Atom Registry liest die Zahlungs-Metadaten des Empfängers direkt aus der Blockchain - Chain, Denom und Adresse werden live überprüft, bevor irgendetwas vorbereitet wird.",
      es: "Atom Registry lee los metadatos de pago del destinatario directamente desde la blockchain: cadena, denom y dirección se verifican en vivo antes de preparar nada.",
      pl: "Atom Registry odczytuje metadane płatności odbiorcy bezpośrednio z blockchaina - sieć, denom i adres są weryfikowane na żywo, zanim cokolwiek zostanie przygotowane.",
      pt: "O Atom Registry lê os metadados de pagamento do destinatário diretamente da blockchain - cadeia, denom e endereço são verificados em tempo real antes de qualquer preparação."
    },
    "Review & sign in your wallet": {
      de: "In deiner Wallet prüfen und signieren",
      es: "Revisa y firma en tu wallet",
      pl: "Sprawdź i podpisz w portfelu",
      pt: "Revê e assina na tua carteira"
    },
    "Your wallet opens with the prepared payment. Check the recipient, amount and memo, then sign. Funds never leave your wallet until you confirm.": {
      de: "Deine Wallet öffnet sich mit der vorbereiteten Zahlung. Prüfe Empfänger, Betrag und Memo, dann signiere. Mittel verlassen deine Wallet erst, wenn du bestätigst.",
      es: "Tu wallet se abre con el pago preparado. Comprueba destinatario, cantidad y memo, y luego firma. Los fondos no salen de tu wallet hasta que confirmes.",
      pl: "Twój portfel otwiera się z przygotowaną płatnością. Sprawdź odbiorcę, kwotę i memo, a następnie podpisz. Środki nie opuszczają portfela, dopóki nie potwierdzisz.",
      pt: "A tua carteira abre com o pagamento preparado. Verifica o destinatário, o valor e o memo e depois assina. Os fundos só saem da carteira quando confirmares."
    },

    "Share it anywhere": {
      de: "Überall teilen",
      es: "Compártelo en cualquier lugar",
      pl: "Udostępnij gdziekolwiek",
      pt: "Partilha em qualquer lugar"
    },
    "Drop the link in chat, email or socials. Anyone with a Cosmos wallet can pay you - no address required.": {
      de: "Teile den Link in Chat, E-Mail oder sozialen Netzwerken. Jeder mit einer Cosmos-Wallet kann dich bezahlen - keine Adresse nötig.",
      es: "Comparte el enlace en chat, correo o redes sociales. Cualquier persona con una wallet Cosmos puede pagarte - no hace falta dirección.",
      pl: "Wrzuć link na czacie, w mailu lub mediach społecznościowych. Każdy z portfelem Cosmos może Ci zapłacić - bez podawania adresu.",
      pt: "Partilha o link em chat, e-mail ou redes sociais. Qualquer pessoa com uma carteira Cosmos pode pagar-te - sem precisar de endereço."
    },
    "Print a QR code": {
      de: "Einen QR-Code drucken",
      es: "Imprimir un código QR",
      pl: "Wydrukuj kod QR",
      pt: "Imprime um código QR"
    },
    "Download the QR and add it to invoices, receipts, business cards or your physical storefront.": {
      de: "Lade den QR-Code herunter und füge ihn zu Rechnungen, Quittungen, Visitenkarten oder deinem physischen Geschäft hinzu.",
      es: "Descarga el QR y añádelo a facturas, recibos, tarjetas de visita o a tu tienda física.",
      pl: "Pobierz kod QR i dodaj go do faktur, paragonów, wizytówek lub fizycznego sklepu.",
      pt: "Faz o download do QR e adiciona-o a faturas, recibos, cartões de visita ou à tua loja física."
    },
    "Set a fixed amount": {
      de: "Einen festen Betrag festlegen",
      es: "Fijar una cantidad concreta",
      pl: "Ustaw stałą kwotę",
      pt: "Definir um valor fixo"
    },
    "Lock the price so the sender sees the exact figure - append": {
      de: "Lege den Preis fest, damit der Sender den genauen Betrag sieht - hänge an",
      es: "Bloquea el precio para que el remitente vea la cifra exacta - añade",
      pl: "Zablokuj cenę, aby wysyłający widział dokładną kwotę - dopisz",
      pt: "Bloqueia o preço para que o remetente veja o valor exato - anexa"
    },
    "Tag with a memo": {
      de: "Mit einem Memo versehen",
      es: "Etiquetar con un memo",
      pl: "Oznacz notatką (memo)",
      pt: "Etiquetar com um memo"
    },
    "Mark the payment for accounting or order tracking - append": {
      de: "Markiere die Zahlung für Buchhaltung oder Bestellverfolgung - hänge an",
      es: "Marca el pago para la contabilidad o el seguimiento del pedido - añade",
      pl: "Oznacz płatność na potrzeby księgowości lub śledzenia zamówień - dopisz",
      pt: "Marca o pagamento para contabilidade ou rastreamento de pedidos - anexa"
    },

    "Will opening a pay link spend my funds automatically?": {
      de: "Werden durch das Öffnen eines Zahlungs-Links automatisch meine Mittel ausgegeben?",
      es: "¿Abrir un enlace de pago gastará mis fondos automáticamente?",
      pl: "Czy otwarcie linku płatności automatycznie wyda moje środki?",
      pt: "Abrir um link de pagamento gasta os meus fundos automaticamente?"
    },
    "What if the recipient has not configured payment metadata?": {
      de: "Was ist, wenn der Empfänger keine Zahlungs-Metadaten konfiguriert hat?",
      es: "¿Y si el destinatario no ha configurado metadatos de pago?",
      pl: "Co jeśli odbiorca nie skonfigurował metadanych płatności?",
      pt: "E se o destinatário não tiver configurado metadados de pagamento?"
    },
    "How do I know the payment goes to the right person?": {
      de: "Woher weiß ich, dass die Zahlung an die richtige Person geht?",
      es: "¿Cómo sé que el pago llega a la persona correcta?",
      pl: "Skąd mam wiedzieć, że płatność trafia do właściwej osoby?",
      pt: "Como sei que o pagamento vai para a pessoa certa?"
    },
    "Can I cancel or reverse a payment after signing?": {
      de: "Kann ich eine Zahlung nach dem Signieren stornieren oder rückgängig machen?",
      es: "¿Puedo cancelar o revertir un pago tras firmar?",
      pl: "Czy mogę anulować lub cofnąć płatność po podpisaniu?",
      pt: "Posso cancelar ou reverter um pagamento depois de assinar?"
    },
    "Do I need an Atom Registry name just to send a payment?": {
      de: "Brauche ich einen Atom Registry-Namen, nur um eine Zahlung zu senden?",
      es: "¿Necesito un nombre de Atom Registry solo para enviar un pago?",
      pl: "Czy potrzebuję nazwy Atom Registry, żeby tylko wysłać płatność?",
      pt: "Preciso de um nome Atom Registry só para enviar um pagamento?"
    },
    "Is there a fee for using Atom Registry Pay?": {
      de: "Gibt es eine Gebühr für die Nutzung von Atom Registry Pay?",
      es: "¿Hay alguna comisión por usar Atom Registry Pay?",
      pl: "Czy korzystanie z Atom Registry Pay wiąże się z opłatą?",
      pt: "Há alguma taxa para usar o Atom Registry Pay?"
    },

    "No. A pay link only opens a prepared payment intent inside your wallet. Nothing is broadcast to the network until you review the transaction and sign it yourself.": {
      de: "Nein. Ein Zahlungs-Link öffnet nur einen vorbereiteten Zahlungs-Intent in deiner Wallet. Es wird nichts an das Netzwerk gesendet, bis du die Transaktion prüfst und selbst signierst.",
      es: "No. Un enlace de pago solo abre una intención de pago preparada dentro de tu wallet. Nada se envía a la red hasta que revisas la transacción y la firmas tú mismo.",
      pl: "Nie. Link płatności otwiera jedynie przygotowaną intencję płatności w Twoim portfelu. Nic nie jest wysyłane do sieci, dopóki nie sprawdzisz transakcji i sam jej nie podpiszesz.",
      pt: "Não. Um link de pagamento apenas abre uma intenção de pagamento preparada dentro da tua carteira. Nada é transmitido à rede até reveres a transação e a assinares."
    },
    "Atom Registry falls back to the domain owner's address and clearly flags it with a yellow badge, so you can decide whether to proceed or wait until the owner adds proper payment routing.": {
      de: "Atom Registry greift dann auf die Adresse des Domain-Eigentümers zurück und markiert dies deutlich mit einem gelben Hinweis, damit du entscheiden kannst, ob du fortfährst oder wartest, bis der Eigentümer ein korrektes Payment-Routing einrichtet.",
      es: "Atom Registry recurre a la dirección del propietario del dominio y la marca claramente con una insignia amarilla, para que decidas si continuar o esperar a que el propietario configure un enrutamiento de pago adecuado.",
      pl: "Atom Registry korzysta wtedy z adresu właściciela domeny i wyraźnie oznacza to żółtą plakietką, abyś mógł zdecydować, czy kontynuować, czy poczekać, aż właściciel skonfiguruje właściwe metadane płatności.",
      pt: "O Atom Registry recorre ao endereço do proprietário do domínio e sinaliza-o claramente com um selo amarelo, para que possas decidir se prossegues ou esperas que o proprietário configure o encaminhamento de pagamento adequado."
    },
    "Every recipient is resolved live from on-chain metadata. The interface shows the resolved address, its source and the target chain - verify them in your wallet before signing.": {
      de: "Jeder Empfänger wird live aus On-Chain-Metadaten aufgelöst. Die Oberfläche zeigt die aufgelöste Adresse, ihre Quelle und die Ziel-Chain - überprüfe diese in deiner Wallet, bevor du signierst.",
      es: "Cada destinatario se resuelve en vivo a partir de metadatos on-chain. La interfaz muestra la dirección resuelta, su origen y la cadena de destino - verifícalos en tu wallet antes de firmar.",
      pl: "Każdy odbiorca jest rozwiązywany na żywo na podstawie metadanych on-chain. Interfejs pokazuje rozwiązany adres, jego źródło i docelową sieć - zweryfikuj je w portfelu przed podpisaniem.",
      pt: "Cada destinatário é resolvido em tempo real a partir de metadados on-chain. A interface mostra o endereço resolvido, a sua fonte e a cadeia de destino - verifica-os na tua carteira antes de assinar."
    },
    "No. Blockchain transactions are final once broadcast. Always confirm the recipient name, amount and memo inside your wallet before approving the signature.": {
      de: "Nein. Blockchain-Transaktionen sind nach dem Senden endgültig. Bestätige immer den Empfängernamen, den Betrag und das Memo in deiner Wallet, bevor du die Signatur freigibst.",
      es: "No. Las transacciones blockchain son definitivas una vez transmitidas. Confirma siempre el nombre del destinatario, la cantidad y el memo en tu wallet antes de aprobar la firma.",
      pl: "Nie. Transakcje na blockchainie są ostateczne po wysłaniu. Zawsze potwierdzaj nazwę odbiorcy, kwotę i memo w portfelu, zanim zatwierdzisz podpis.",
      pt: "Não. As transações em blockchain são finais assim que transmitidas. Confirma sempre o nome do destinatário, o valor e o memo na tua carteira antes de aprovar a assinatura."
    },
    "Senders only need a Cosmos-compatible wallet. A registered name is required for the recipient so Atom Registry can resolve their payment metadata.": {
      de: "Sender benötigen nur eine Cosmos-kompatible Wallet. Ein registrierter Name ist nur für den Empfänger erforderlich, damit Atom Registry seine Zahlungs-Metadaten auflösen kann.",
      es: "Quien envía solo necesita una wallet compatible con Cosmos. El nombre registrado es necesario solo para el destinatario, para que Atom Registry pueda resolver sus metadatos de pago.",
      pl: "Wysyłający potrzebuje wyłącznie portfela kompatybilnego z Cosmos. Zarejestrowana nazwa jest wymagana po stronie odbiorcy, aby Atom Registry mogło rozwiązać jego metadane płatności.",
      pt: "Quem envia só precisa de uma carteira compatível com Cosmos. Um nome registado é necessário apenas para o destinatário, para que o Atom Registry possa resolver os seus metadados de pagamento."
    },
    "Atom Registry Pay itself charges nothing extra. You only pay the standard network gas fee that your wallet displays before you sign the transaction.": {
      de: "Atom Registry Pay selbst berechnet nichts zusätzlich. Du zahlst nur die übliche Netzwerk-Gas-Gebühr, die deine Wallet vor dem Signieren anzeigt.",
      es: "Atom Registry Pay no cobra nada adicional. Solo pagas la comisión de gas estándar de la red que tu wallet muestra antes de firmar la transacción.",
      pl: "Atom Registry Pay sam w sobie nie pobiera dodatkowych opłat. Płacisz wyłącznie standardową opłatę sieciową (gas) wyświetlaną przez portfel przed podpisaniem transakcji.",
      pt: "O Atom Registry Pay em si não cobra nada adicional. Pagas apenas a taxa de gas habitual da rede que a tua carteira mostra antes de assinares a transação."
    },

    "How Atom Registry Pay works": {
      de: "So funktioniert Atom Registry Pay",
      es: "Cómo funciona Atom Registry Pay",
      pl: "Jak działa Atom Registry Pay",
      pt: "Como funciona o Atom Registry Pay"
    },
    "Everything you need before sending or receiving.": {
      de: "Alles, was du vor dem Senden oder Empfangen wissen musst.",
      es: "Todo lo que necesitas saber antes de enviar o recibir.",
      pl: "Wszystko, co musisz wiedzieć przed wysłaniem lub odebraniem.",
      pt: "Tudo o que precisas de saber antes de enviar ou receber."
    },

    "How does Atom Registry Pay actually work?": {
      de: "Wie funktioniert Atom Registry Pay genau?",
      es: "¿Cómo funciona realmente Atom Registry Pay?",
      pl: "Jak właściwie działa Atom Registry Pay?",
      pt: "Como é que o Atom Registry Pay funciona, exatamente?"
    },
    "Three steps from start to finish. First, you enter or open a registered Atom Registry name such as alice.atom. Second, Atom Registry reads the recipient's payment metadata directly from the blockchain - chain, denom and address are verified live before anything is prepared. Third, your wallet opens with the ready payment so you can review the recipient, amount and memo before signing. Funds never leave your wallet until you confirm.": {
      de: "Drei Schritte von Anfang bis Ende. Zuerst gibst du einen registrierten Atom Registry-Namen wie alice.atom ein oder öffnest ihn. Dann liest Atom Registry die Zahlungs-Metadaten des Empfängers direkt aus der Blockchain - Chain, Denom und Adresse werden live überprüft, bevor irgendetwas vorbereitet wird. Zum Schluss öffnet sich deine Wallet mit der fertigen Zahlung, sodass du Empfänger, Betrag und Memo vor dem Signieren prüfen kannst. Die Mittel verlassen deine Wallet erst, wenn du bestätigst.",
      es: "Tres pasos de principio a fin. Primero, introduces o abres un nombre registrado de Atom Registry, como alice.atom. Después, Atom Registry lee los metadatos de pago del destinatario directamente desde la blockchain: cadena, denom y dirección se verifican en vivo antes de preparar nada. Por último, tu wallet se abre con el pago listo para que revises destinatario, cantidad y memo antes de firmar. Los fondos no salen de tu wallet hasta que confirmes.",
      pl: "Trzy kroki od początku do końca. Najpierw wpisujesz lub otwierasz zarejestrowaną nazwę Atom Registry, np. alice.atom. Następnie Atom Registry odczytuje metadane płatności odbiorcy bezpośrednio z blockchaina - sieć, denom i adres są weryfikowane na żywo, zanim cokolwiek zostanie przygotowane. Na koniec Twój portfel otwiera się z gotową płatnością, dzięki czemu możesz sprawdzić odbiorcę, kwotę i memo przed podpisaniem. Środki nie opuszczają portfela, dopóki nie potwierdzisz.",
      pt: "Três passos do início ao fim. Primeiro, escreves ou abres um nome registado do Atom Registry, como alice.atom. Depois, o Atom Registry lê os metadados de pagamento do destinatário diretamente da blockchain - cadeia, denom e endereço são verificados em tempo real antes de qualquer preparação. Por fim, a tua carteira abre com o pagamento pronto para reveres o destinatário, valor e memo antes de assinar. Os fundos só saem da carteira quando confirmares."
    },

    "How can I share my pay link?": {
      de: "Wie kann ich meinen Zahlungs-Link teilen?",
      es: "¿Cómo puedo compartir mi enlace de pago?",
      pl: "Jak mogę udostępnić swój link płatności?",
      pt: "Como posso partilhar o meu link de pagamento?"
    },
    "Once a link is generated, share it the same way you would any URL - chat apps, email, social media or a printed QR code on invoices, posters, receipts and storefronts. Anyone with a Cosmos-compatible wallet can scan the QR or open the link and pay you, without ever needing your wallet address.": {
      de: "Sobald ein Link erzeugt ist, teilst du ihn wie jede andere URL - Chat-Apps, E-Mail, soziale Netzwerke oder als gedruckten QR-Code auf Rechnungen, Postern, Quittungen und Schaufenstern. Jeder mit einer Cosmos-kompatiblen Wallet kann den QR scannen oder den Link öffnen und dich bezahlen, ohne jemals deine Wallet-Adresse zu brauchen.",
      es: "Una vez generado el enlace, compártelo igual que cualquier URL: aplicaciones de chat, correo, redes sociales o un código QR impreso en facturas, pósters, recibos y escaparates. Cualquier persona con una wallet compatible con Cosmos puede escanear el QR o abrir el enlace y pagarte, sin necesitar tu dirección.",
      pl: "Po wygenerowaniu linku udostępniaj go tak samo jak każdy inny adres URL - w komunikatorach, mailu, mediach społecznościowych lub w postaci wydrukowanego kodu QR na fakturach, plakatach, paragonach i w sklepie. Każdy, kto ma portfel kompatybilny z Cosmos, może zeskanować QR lub otworzyć link i zapłacić, bez potrzeby znajomości adresu portfela.",
      pt: "Depois de gerar o link, partilha-o como qualquer outro URL - em apps de chat, e-mail, redes sociais ou como código QR impresso em faturas, cartazes, recibos e lojas físicas. Qualquer pessoa com uma carteira compatível com Cosmos pode digitalizar o QR ou abrir o link e pagar-te, sem nunca precisar do teu endereço."
    },

    "Can I lock a fixed amount in the link?": {
      de: "Kann ich einen festen Betrag im Link festlegen?",
      es: "¿Puedo bloquear una cantidad fija en el enlace?",
      pl: "Czy mogę zablokować stałą kwotę w linku?",
      pt: "Posso fixar um valor no link?"
    },
    "Yes. Add the suffix below to your pay link to pre-fill an exact amount in ATOM. The sender sees this figure in the preview and again inside their wallet before signing - they cannot accidentally pay a different number.": {
      de: "Ja. Hänge das untenstehende Suffix an deinen Zahlungs-Link, um einen exakten Betrag in ATOM voreinzustellen. Der Sender sieht diesen Wert in der Vorschau und nochmals in seiner Wallet vor dem Signieren - er kann nicht versehentlich einen anderen Betrag bezahlen.",
      es: "Sí. Añade el sufijo de abajo a tu enlace de pago para preconfigurar una cantidad exacta en ATOM. El remitente ve esta cifra en la vista previa y de nuevo dentro de su wallet antes de firmar - no podrá pagar otra cantidad por error.",
      pl: "Tak. Dopisz poniższy sufiks do swojego linku płatności, aby wstępnie ustawić dokładną kwotę w ATOM. Wysyłający zobaczy tę liczbę w podglądzie i ponownie w portfelu przed podpisaniem - nie zapłaci przez pomyłkę innej kwoty.",
      pt: "Sim. Adiciona o sufixo abaixo ao teu link de pagamento para preencher um valor exato em ATOM. O remetente vê este número na pré-visualização e novamente dentro da carteira antes de assinar - não pode pagar acidentalmente um valor diferente."
    },

    "What is the memo field for?": {
      de: "Wofür ist das Memo-Feld?",
      es: "¿Para qué sirve el campo memo?",
      pl: "Do czego służy pole memo?",
      pt: "Para que serve o campo memo?"
    },
    "The memo is a short text note attached to the on-chain transaction. Use it for invoice numbers, order IDs or accounting tags. Add the suffix below to your pay link to pre-fill the memo automatically when the sender opens it.": {
      de: "Das Memo ist eine kurze Textnotiz, die an die On-Chain-Transaktion angehängt wird. Verwende es für Rechnungsnummern, Bestell-IDs oder Buchhaltungs-Tags. Hänge das untenstehende Suffix an deinen Zahlungs-Link, um das Memo automatisch vorzuausfüllen, sobald der Sender es öffnet.",
      es: "El memo es una nota de texto corta adjunta a la transacción on-chain. Úsalo para números de factura, ID de pedido o etiquetas contables. Añade el sufijo de abajo a tu enlace de pago para que el memo se rellene automáticamente cuando el remitente lo abra.",
      pl: "Memo to krótka notatka tekstowa dołączana do transakcji on-chain. Wykorzystaj je do numerów faktur, identyfikatorów zamówień lub oznaczeń księgowych. Dopisz poniższy sufiks do swojego linku płatności, aby memo było wypełniane automatycznie, gdy wysyłający otworzy link.",
      pt: "O memo é uma pequena nota de texto anexada à transação on-chain. Usa-o para números de fatura, IDs de pedido ou etiquetas contabilísticas. Adiciona o sufixo abaixo ao teu link de pagamento para preencher o memo automaticamente quando o remetente o abrir."
    },

    "Why does it fall back to the domain owner's address?": {
      de: "Warum wird auf die Adresse des Domain-Eigentümers zurückgegriffen?",
      es: "¿Por qué recurre a la dirección del propietario del dominio?",
      pl: "Dlaczego system korzysta wtedy z adresu właściciela domeny?",
      pt: "Porque é que recorre ao endereço do proprietário do domínio?"
    },
    "If a recipient has not configured payment metadata yet, Atom Registry uses the domain owner's wallet address as a sensible default and clearly flags it with a yellow badge. The owner can later add payment metadata to route payments to a different wallet, without changing the link or QR.": {
      de: "Wenn ein Empfänger noch keine Zahlungs-Metadaten konfiguriert hat, verwendet Atom Registry die Wallet-Adresse des Domain-Eigentümers als sinnvollen Standard und markiert dies klar mit einem gelben Hinweis. Der Eigentümer kann später Zahlungs-Metadaten hinzufügen, um Zahlungen an eine andere Wallet weiterzuleiten, ohne den Link oder QR zu ändern.",
      es: "Si un destinatario aún no ha configurado metadatos de pago, Atom Registry usa la dirección de wallet del propietario del dominio como valor por defecto razonable y lo marca claramente con una insignia amarilla. El propietario puede añadir más tarde metadatos de pago para enviar los pagos a otra wallet, sin cambiar el enlace ni el QR.",
      pl: "Jeśli odbiorca nie skonfigurował jeszcze metadanych płatności, Atom Registry używa adresu portfela właściciela domeny jako rozsądnego domyślnego adresu i wyraźnie oznacza to żółtą plakietką. Właściciel może później dodać metadane płatności, aby kierować płatności na inny portfel, bez konieczności zmiany linku ani kodu QR.",
      pt: "Se um destinatário ainda não tiver configurado metadados de pagamento, o Atom Registry usa o endereço da carteira do proprietário do domínio como predefinição sensata e sinaliza-o claramente com um selo amarelo. O proprietário pode mais tarde adicionar metadados de pagamento para encaminhar pagamentos para outra carteira, sem alterar o link ou o QR."
    },
  };

  const translationIndex = new Map();

  function normalizeText(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .replace(/\s+([.,!?;:])/g, "$1")
      .trim();
  }

  function buildTranslationIndex() {
    Object.keys(EN).forEach((source) => {
      translationIndex.set(normalizeText(source), source);
    });
  }

  function getTranslation(sourceText, lang) {
    const normalized = normalizeText(sourceText);
    const key = translationIndex.get(normalized);

    if (!key) return null;
    if (lang === "en") return key;

    return EN[key]?.[lang] || key;
  }

  function shouldSkipTextNode(node) {
    const parent = node.parentElement;
    if (!parent) return true;

    const tag = parent.tagName;
    if (["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "CODE"].includes(tag)) return true;
    if (parent.closest("[data-no-translate]")) return true;

    const value = normalizeText(node.nodeValue);
    if (!value) return true;
    if (/^[-.\d\s]+$/.test(value)) return true;
    if (/^cosmos1/i.test(value)) return true;
    if (/^\.[a-z0-9-]+$/i.test(value)) return true;

    return false;
  }

  function translateTextNodes(root, lang) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        return shouldSkipTextNode(node)
          ? NodeFilter.FILTER_REJECT
          : NodeFilter.FILTER_ACCEPT;
      },
    });

    const nodes = [];
    while (walker.nextNode()) {
      nodes.push(walker.currentNode);
    }

    nodes.forEach((node) => {
      const original = node.__atomRegistryOriginalText || normalizeText(node.nodeValue);
      const translated = getTranslation(original, lang);

      if (!translated) return;

      if (!node.__atomRegistryOriginalText) {
        node.__atomRegistryOriginalText = original;
      }

      const leading = (node.nodeValue.match(/^\s*/) || [""])[0];
      const trailing = (node.nodeValue.match(/\s*$/) || [""])[0];
      node.nodeValue = leading + translated + trailing;
    });
  }

  function translateAttributes(root, lang) {
    const attrNames = ["placeholder", "aria-label", "title", "alt", "content"];

    const elements = root.querySelectorAll
      ? root.querySelectorAll("[placeholder], [aria-label], [title], [alt], meta[name='description']")
      : [];

    elements.forEach((element) => {
      attrNames.forEach((attrName) => {
        if (!element.hasAttribute(attrName)) return;

        const current = element.getAttribute(attrName);
        const originalAttrName = `data-ar-original-${attrName}`;
        const original = element.getAttribute(originalAttrName) || current;

        if (!element.hasAttribute(originalAttrName)) {
          element.setAttribute(originalAttrName, original);
        }

        const translated = getTranslation(original, lang);
        if (translated) {
          element.setAttribute(attrName, translated);
        }
      });
    });
  }

  function translateSelectOptions(root, lang) {
    const options = root.querySelectorAll ? root.querySelectorAll("option") : [];

    options.forEach((option) => {
      const original = option.dataset.arOriginalText || normalizeText(option.textContent);
      if (!option.dataset.arOriginalText) {
        option.dataset.arOriginalText = original;
      }

      const translated = getTranslation(original, lang);
      if (translated) {
        option.textContent = translated;
      }
    });
  }

  function setLanguageVisualState(lang) {
    const meta = LANGUAGE_META[lang] || LANGUAGE_META.en;
    const currentFlag = document.getElementById("languageCurrentFlag");
    const currentCode = document.getElementById("languageCurrentCode");
    const options = Array.from(document.querySelectorAll(".ar-lang-option"));

    if (currentFlag) currentFlag.textContent = meta.flag;
    if (currentCode) currentCode.textContent = meta.code;

    options.forEach((option) => {
      const isActive = option.dataset.lang === lang;
      option.classList.toggle("active", isActive);
      option.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    document.documentElement.lang = meta.htmlLang;
  }

  function translatePage(lang) {
    const safeLang = LANGUAGE_META[lang] ? lang : "en";

    document.documentElement.setAttribute("data-language", safeLang);
    setLanguageVisualState(safeLang);

    if (document.title) {
      const originalTitle = document.documentElement.dataset.arOriginalTitle || document.title;
      document.documentElement.dataset.arOriginalTitle = originalTitle;
      const translatedTitle = getTranslation(originalTitle, safeLang);
      if (translatedTitle) document.title = translatedTitle;
    }

    translateTextNodes(document.body, safeLang);
    translateAttributes(document, safeLang);
    translateSelectOptions(document, safeLang);

    window.ATOM_REGISTRY_CURRENT_LANGUAGE = safeLang;
    window.dispatchEvent(new CustomEvent("atomregistry:languagechange", {
      detail: { language: safeLang },
    }));
  }

  function closeLanguageMenu() {
    const switcher = document.getElementById("languageSwitcher");
    const toggle = document.getElementById("languageToggle");

    if (switcher) switcher.classList.remove("open");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
  }

  function bindLanguageSwitcher() {
    const switcher = document.getElementById("languageSwitcher");
    const toggle = document.getElementById("languageToggle");
    const options = Array.from(document.querySelectorAll(".ar-lang-option"));

    if (!switcher || !toggle || !options.length) return;

    toggle.addEventListener("click", (event) => {
      event.stopPropagation();
      const isOpen = switcher.classList.toggle("open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    options.forEach((option) => {
      option.addEventListener("click", (event) => {
        event.stopPropagation();

        const lang = option.dataset.lang || "en";
        localStorage.setItem(STORAGE_KEY, lang);
        translatePage(lang);
        closeLanguageMenu();
      });
    });

    document.addEventListener("click", (event) => {
      if (!switcher.contains(event.target)) {
        closeLanguageMenu();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeLanguageMenu();
        toggle.focus();
      }
    });
  }

  function observeDynamicText() {
    const observer = new MutationObserver((mutations) => {
      const lang = window.ATOM_REGISTRY_CURRENT_LANGUAGE || localStorage.getItem(STORAGE_KEY) || "en";
      if (lang === "en") return;

      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            const translated = getTranslation(node.nodeValue, lang);
            if (translated) {
              node.__atomRegistryOriginalText = normalizeText(node.nodeValue);
              node.nodeValue = translated;
            }
            return;
          }

          if (node.nodeType === Node.ELEMENT_NODE) {
            translateTextNodes(node, lang);
            translateAttributes(node, lang);
            translateSelectOptions(node, lang);
          }
        });
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  function initLanguages() {
    buildTranslationIndex();
    bindLanguageSwitcher();

    const saved = localStorage.getItem(STORAGE_KEY);
    const browserLang = (navigator.language || "en").slice(0, 2).toLowerCase();
    const initialLang = LANGUAGE_META[saved]
      ? saved
      : LANGUAGE_META[browserLang]
        ? browserLang
        : "en";

    translatePage(initialLang);
    observeDynamicText();
  }

  window.ATOM_REGISTRY_LANGUAGES = EN;
  window.AtomRegistryLanguages = {
    init: initLanguages,
    setLanguage(lang) {
      if (!LANGUAGE_META[lang]) return;
      localStorage.setItem(STORAGE_KEY, lang);
      translatePage(lang);
    },
    getLanguage() {
      return window.ATOM_REGISTRY_CURRENT_LANGUAGE || localStorage.getItem(STORAGE_KEY) || "en";
    },
    translatePage,
    translations: EN,
  };
})();
