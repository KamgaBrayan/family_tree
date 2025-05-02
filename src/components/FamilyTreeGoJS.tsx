import React, { useEffect, useCallback, useRef } from 'react';
import * as go from 'gojs';
import { PersonWithRelationship } from '../types/interfaces';

interface FamilyTreeGoJSProps {
  familyMembers: PersonWithRelationship[];
  rootPerson: PersonWithRelationship | null;
  selectedPerson: PersonWithRelationship | null;
  onSelectPerson: (person: PersonWithRelationship) => void;
}

const FamilyTreeGoJS: React.FC<FamilyTreeGoJSProps> = ({
  familyMembers,
  rootPerson,
  selectedPerson,
  onSelectPerson,
}) => {
  // Utiliser un ID unique pour le div du diagramme
  const diagramDivId = "familyTreeDiagram";
  // Référence pour suivre si le diagramme a été initialisé
  const diagramInitializedRef = useRef(false);
  // Référence pour stocker l'instance du diagramme (évite les re-rendus)
  const diagramRef = useRef<go.Diagram | null>(null);

  // Fonction pour créer le diagramme - enveloppée dans useCallback pour éviter les recréations
  const createDiagram = useCallback(() => {
    console.log('Creating new diagram instance');
    const $ = go.GraphObject.make;
    
    // Créer un nouveau diagramme
    const diagram = new go.Diagram(diagramDivId, {
      initialContentAlignment: go.Spot.Center,
      // Utiliser un layout simple mais efficace pour organiser les nœuds selon leur relation
      layout: $(go.TreeLayout, {
        angle: 90,  // de haut en bas
        nodeSpacing: 40,  // espace horizontal entre les nœuds
        layerSpacing: 80,  // espace vertical entre les générations
        arrangement: go.TreeLayout.ArrangementFixedRoots,
        // Positionner les parents au-dessus, les enfants en-dessous
        // et les frères/sœurs à gauche et à droite
        isRealtime: false,
        isOngoing: false
      }),
      "undoManager.isEnabled": true,
      allowZoom: true,
      allowHorizontalScroll: true,
      allowVerticalScroll: true,
      padding: 40,
    });

    // Node template
    diagram.nodeTemplate = $(
      go.Node,
      "Auto",
      {
        selectionAdornmentTemplate: $(
          go.Adornment,
          "Auto",
          $(go.Shape, "RoundedRectangle", { 
            fill: "rgba(99, 102, 241, 0.1)", 
            stroke: "#6366F1", 
            strokeWidth: 2,
            strokeDashArray: [3, 3]
          }),
          $(go.Placeholder)
        ),
        cursor: 'pointer',
        click: (e, node) => {
          const data = node.part?.data;
          if (data && onSelectPerson) {
            onSelectPerson(data as PersonWithRelationship);
          }
        },
      },
      // Effet d'animation au survol
      new go.Binding("scale", "isSelected", s => s ? 1.05 : 1)
        .ofObject(),
      $(go.Shape, "RoundedRectangle", {
        fill: "white",
        stroke: "#E2E8F0",
        strokeWidth: 1.5,
      }),
      $(
        go.Panel,
        "Vertical",
        { margin: 8, defaultAlignment: go.Spot.Center },
        // Indicateur de genre
        $(go.Shape, "Circle", {
          width: 16, 
          height: 16, 
          alignment: go.Spot.TopRight,
          margin: new go.Margin(0, 0, 4, 0),
        }, new go.Binding("fill", "sex", s => s === 'M' ? "#3B82F6" : s === 'F' ? "#EC4899" : "#9CA3AF")),
        // PHOTO
        $(go.Picture, {
          margin: 4,
          width: 60,
          height: 60,
          background: '#fff',
          imageStretch: go.GraphObject.UniformToFill,
          source: '',
          // Bordure ronde pour la photo
          portId: "",
          fromLinkable: true,
          toLinkable: true,
          cursor: "pointer",
          fromLinkableSelfNode: false,
          toLinkableSelfNode: false,
          fromLinkableDuplicates: false,
          toLinkableDuplicates: false
        }, new go.Binding('source', 'profile_image_url', v => v || undefined)),
        // Initiales si pas de photo
        $(go.TextBlock, {
          margin: new go.Margin(0, 0, 4, 0),
          font: "bold 22px sans-serif",
          stroke: "#6366F1",
          visible: false,
          background: "#E0E7FF",
          width: 60,
          height: 60,
          textAlign: "center",
          verticalAlignment: go.Spot.Center
        },
        new go.Binding('text', '', d => {
          if (d && d.first_name && d.last_name) {
            return d.first_name.charAt(0) + d.last_name.charAt(0);
          }
          return "";
        }),
        new go.Binding('visible', 'profile_image_url', v => !v)),
        // NOM COMPLET
        $(go.TextBlock, {
          margin: new go.Margin(2, 0, 0, 0),
          font: "bold 14px sans-serif",
          stroke: "#1E293B",
          textAlign: "center",
          maxSize: new go.Size(120, NaN),
          wrap: go.TextBlock.WrapFit
        }, new go.Binding("text", "", d => {
          if (d && d.first_name && d.last_name) {
            return `${d.first_name} ${d.last_name}`;
          }
          return "";
        })),
        // OCCUPATION
        $(go.TextBlock, {
          margin: new go.Margin(2, 0, 0, 0),
          font: "12px sans-serif",
          stroke: "#64748B",
          textAlign: "center",
          maxSize: new go.Size(120, NaN),
          wrap: go.TextBlock.WrapFit
        }, new go.Binding("text", "occupation", v => v || "")),
        // DATE DE NAISSANCE
        $(go.TextBlock, {
          margin: new go.Margin(2, 0, 0, 0),
          font: "11px sans-serif",
          stroke: "#94A3B8",
          textAlign: "center",
          maxSize: new go.Size(120, NaN),
          wrap: go.TextBlock.WrapFit
        }, new go.Binding("text", "birth_date", d => d ? `Né(e) le ${d}` : ""))
      )
    );

    // Link template avec différents styles selon le type de relation
    diagram.linkTemplateMap.add("",  // Template par défaut
      $(go.Link,
        {
          routing: go.Link.Orthogonal,
          corner: 10,
          curviness: 10,
          relinkableFrom: false,
          relinkableTo: false,
          reshapable: false,
          resegmentable: false,
          toShortLength: 4
        },
        $(go.Shape, { 
          stroke: "#A5B4FC", 
          strokeWidth: 2,
          strokeDashArray: null
        }, 
        // Couleur différente selon la génération
        new go.Binding("stroke", "", (d) => {
          // Obtenir la génération du lien en fonction de la relation
          const rel = d.relationship || '';
          const gen = Math.abs(d.generation || 0);
          
          // Couleurs par génération
          const colors = [
            "#3B82F6", // Bleu - Génération 0 (personne centrale)
            "#10B981", // Vert - Génération 1 (parents/enfants)
            "#F59E0B", // Jaune - Génération 2 (grands-parents/petits-enfants)
            "#EF4444", // Rouge - Génération 3
            "#8B5CF6"  // Violet - Génération 4+
          ];
          
          // Couleurs spéciales pour certaines relations
          if (rel === "spouse") return "#EC4899"; // Rose pour les conjoints
          if (rel === "sibling") return "#6366F1"; // Indigo pour les frères/sœurs
          
          // Couleur basée sur la génération
          return colors[Math.min(gen, colors.length - 1)];
        })),
        $(go.Shape, { 
          toArrow: "Standard", 
          fill: "#3B82F6", 
          stroke: "#3B82F6",
          scale: 0.8
        },
        // Couleur de la flèche selon la génération
        new go.Binding("fill", "", (d) => {
          // Obtenir la génération du lien en fonction de la relation
          const rel = d.relationship || '';
          const gen = Math.abs(d.generation || 0);
          
          // Couleurs par génération
          const colors = [
            "#3B82F6", // Bleu - Génération 0 (personne centrale)
            "#10B981", // Vert - Génération 1 (parents/enfants)
            "#F59E0B", // Jaune - Génération 2 (grands-parents/petits-enfants)
            "#EF4444", // Rouge - Génération 3
            "#8B5CF6"  // Violet - Génération 4+
          ];
          
          // Couleurs spéciales pour certaines relations
          if (rel === "spouse") return "#EC4899"; // Rose pour les conjoints
          if (rel === "sibling") return "#6366F1"; // Indigo pour les frères/sœurs
          
          // Couleur basée sur la génération
          return colors[Math.min(gen, colors.length - 1)];
        }),
        new go.Binding("stroke", "", (d) => {
          // Obtenir la génération du lien en fonction de la relation
          const rel = d.relationship || '';
          const gen = Math.abs(d.generation || 0);
          
          // Couleurs par génération
          const colors = [
            "#3B82F6", // Bleu - Génération 0 (personne centrale)
            "#10B981", // Vert - Génération 1 (parents/enfants)
            "#F59E0B", // Jaune - Génération 2 (grands-parents/petits-enfants)
            "#EF4444", // Rouge - Génération 3
            "#8B5CF6"  // Violet - Génération 4+
          ];
          
          // Couleurs spéciales pour certaines relations
          if (rel === "spouse") return "#EC4899"; // Rose pour les conjoints
          if (rel === "sibling") return "#6366F1"; // Indigo pour les frères/sœurs
          
          // Couleur basée sur la génération
          return colors[Math.min(gen, colors.length - 1)];
        }))
      )
    );

    // Responsive resize
    diagram.addDiagramListener('InitialLayoutCompleted', () => {
      diagram.zoomToFit();
    });

    return diagram;
  }, [diagramDivId, onSelectPerson]);

  // Initialisation unique du diagramme
  useEffect(() => {
    // Vérifier si le diagramme existe déjà et s'il n'a pas encore été initialisé
    const diagramDiv = document.getElementById(diagramDivId);
    
    if (!diagramDiv) {
      console.log('Diagram div not found');
      return;
    }
    
    if (diagramInitializedRef.current) {
      console.log('Diagram already initialized');
      return;
    }
    
    try {
      console.log('Initializing diagram');
      const diagram = createDiagram();
      diagramRef.current = diagram;
      diagramInitializedRef.current = true;
      
      // Gestionnaire de redimensionnement
      const handleResize = () => {
        if (diagram) {
          diagram.zoomToFit();
        }
      };
      
      // Ajouter l'écouteur de redimensionnement
      window.addEventListener('resize', handleResize);
      
      // Nettoyage lors du démontage
      return () => {
        console.log('Cleaning up diagram');
        window.removeEventListener('resize', handleResize);
        
        // Nettoyer proprement le diagramme
        if (diagram) {
          try {
            diagram.clear();
            diagram.div = null;
          } catch (error) {
            console.error('Error cleaning up diagram:', error);
          }
        }
        
        diagramRef.current = null;
        diagramInitializedRef.current = false;
      };
    } catch (error) {
      console.error("Erreur lors de l'initialisation du diagramme:", error);
      diagramInitializedRef.current = false;
    }
  }, [createDiagram]);

  // Mise à jour du modèle lorsque les données changent
  useEffect(() => {
    // Récupérer l'instance du diagramme depuis la référence
    const diagram = diagramRef.current;
    
    // Ne rien faire s'il n'y a pas de diagramme ou pas de données
    if (!diagram || !familyMembers.length) {
      console.log('No diagram or no family members to display');
      return;
    }
    
    try {
      console.log(`Updating diagram with ${familyMembers.length} family members`);
      
      // Utiliser directement les résultats de l'algorithme BFS sans filtrage supplémentaire
      // familyMembers contient déjà les membres de la famille jusqu'à la génération spécifiée
      const relevantMembers = familyMembers;
      
      console.log(`Displaying ${relevantMembers.length} family members across multiple generations`);
      
      // Préparer les données des nœuds pour le modèle
      const nodeDataArray = relevantMembers.map((person) => {
        return {
          ...person,
          key: person.id,
          // Ajouter des propriétés pour l'affichage
          isRoot: rootPerson && person.id === rootPerson.id
        };
      });
      
      // Préparer les données des liens pour le modèle
      const linkDataArray: Array<{ from: string; to: string; relationship: string }> = [];
      
      // Créer les liens entre les nœuds
      for (const person of relevantMembers) {
        if (person.father_id && relevantMembers.some(p => p.id === person.father_id)) {
          linkDataArray.push({
            from: person.father_id,
            to: person.id,
            relationship: 'parent'
          });
        }
        
        if (person.mother_id && relevantMembers.some(p => p.id === person.mother_id)) {
          linkDataArray.push({
            from: person.mother_id,
            to: person.id,
            relationship: 'parent'
          });
        }
        
        // Ajouter des liens entre conjoints (basé sur spouse_id)
        if (person.spouse_id && relevantMembers.some(p => p.id === person.spouse_id)) {
          // Vérifier si le lien n'existe pas déjà dans l'autre sens
          const existingLink = linkDataArray.some(
            link => link.relationship === 'spouse' && 
                   ((link.from === person.id && link.to === person.spouse_id) ||
                    (link.from === person.spouse_id && link.to === person.id))
          );
          
          if (!existingLink) {
            linkDataArray.push({
              from: person.id,
              to: person.spouse_id,
              relationship: 'spouse'
            });
          }
        }
        
        // Ajouter des liens entre frères et sœurs
        // Uniquement pour les frères et sœurs de la personne sélectionnée pour éviter l'encombrement
        if (selectedPerson && 
            ((person.father_id && person.father_id === selectedPerson.father_id) || 
             (person.mother_id && person.mother_id === selectedPerson.mother_id)) &&
            person.id !== selectedPerson.id) {
          linkDataArray.push({
            from: selectedPerson.id,
            to: person.id,
            relationship: 'sibling'
          });
        }
      }
      
      console.log(`Created ${linkDataArray.length} links between nodes`);
      
      // Mettre à jour le modèle avec un GraphLinksModel au lieu d'un TreeModel
      diagram.model = new go.GraphLinksModel({
        nodeDataArray: nodeDataArray,
        linkDataArray: linkDataArray,
        // Spécifier les propriétés de clé pour les nœuds et les liens
        nodeKeyProperty: "key",
        linkFromKeyProperty: "from",
        linkToKeyProperty: "to"
      });
      
      // Sélectionner la personne si sélectionnée
      if (selectedPerson) {
        const part = diagram.findPartForKey(selectedPerson.id);
        if (part) diagram.select(part);
      }
      
      // Ajuster le zoom
      diagram.zoomToFit();
    } catch (error) {
      console.error("Erreur lors de la mise à jour du diagramme:", error);
    }
  }, [familyMembers, rootPerson, selectedPerson]);

  return (
    <div style={{ 
      width: '100%', 
      height: '80vh', 
      minHeight: 500, 
      background: 'white', 
      borderRadius: 8, 
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
      overflow: 'hidden', 
      position: 'relative', 
      zIndex: 1, 
      transition: 'all 0.3s ease'
    }}>
      {/* Div pour le diagramme GoJS avec ID fixe */}
      <div 
        id={diagramDivId} 
        style={{ 
          width: '100%', 
          height: '100%', 
          position: 'relative' 
        }} 
      />
      
      {/* Message quand aucune donnée n'est disponible */}
      {!familyMembers.length && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          color: '#94A3B8',
          padding: '20px',
          textAlign: 'center'
        }}>
          <div style={{ 
            fontSize: '24px', 
            marginBottom: '12px',
            fontWeight: 'bold',
            color: '#4F46E5'
          }}>
            Aucune relation affichée
          </div>
          <div style={{ 
            fontSize: '16px', 
            maxWidth: '400px',
            lineHeight: '1.5'
          }}>
            Utilisez la barre de recherche en haut pour trouver une personne et afficher ses relations familiales.
          </div>
          <div style={{
            marginTop: '20px',
            fontSize: '14px',
            color: '#64748B',
            maxWidth: '450px'
          }}>
            Cette application utilise des algorithmes de graphe (BFS, DFS, Dijkstra, Kruskal) pour analyser et visualiser les relations familiales.
          </div>
        </div>
      )}
    </div>
  );
};

export default FamilyTreeGoJS;
