import React, { useEffect, useCallback, useRef } from 'react';
import * as go from 'gojs';
import { PersonWithRelationship } from '../types/interfaces';

interface RadialTreeGoJSProps {
  familyMembers: PersonWithRelationship[];
  rootPerson: PersonWithRelationship | null;
  selectedPerson: PersonWithRelationship | null;
  onSelectPerson: (person: PersonWithRelationship) => void;
}

const RadialTreeGoJS: React.FC<RadialTreeGoJSProps> = ({
  familyMembers,
  rootPerson,
  selectedPerson,
  onSelectPerson,
}) => {
  // Utiliser un ID unique pour le div du diagramme
  const diagramDivId = "radialTreeDiagram";
  // Référence pour suivre si le diagramme a été initialisé
  const diagramInitializedRef = useRef(false);
  // Référence pour stocker l'instance du diagramme (évite les re-rendus)
  const diagramRef = useRef<go.Diagram | null>(null);

  // Fonction pour créer le diagramme - enveloppée dans useCallback pour éviter les recréations
  const createDiagram = useCallback(() => {
    console.log('Creating new radial diagram instance');
    const $ = go.GraphObject.make;
    
    // Créer un nouveau diagramme
    const diagram = new go.Diagram(diagramDivId, {
      initialContentAlignment: go.Spot.Center,
      // Utiliser un layout circulaire pour la vue radiale
      layout: $(go.CircularLayout, {
        radius: 200,
        spacing: 60,
        nodeDiameterFormula: go.CircularLayout.Circular,
        direction: go.CircularLayout.Clockwise,
        arrangement: go.CircularLayout.ConstantSpacing,
        sorting: go.CircularLayout.Ascending
      }),
      "undoManager.isEnabled": true,
      allowZoom: true,
      allowHorizontalScroll: true,
      allowVerticalScroll: true,
      padding: 20,
    });

    // Node template
    diagram.nodeTemplate = $(
      go.Node,
      "Auto",
      {
        selectionAdornmentTemplate: $(
          go.Adornment,
          "Auto",
          $(go.Shape, "Circle", { 
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
      $(go.Shape, "Circle", {
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
          width: 12, 
          height: 12, 
          alignment: go.Spot.TopRight,
          margin: new go.Margin(0, 0, 4, 0),
        }, new go.Binding("fill", "sex", s => s === 'M' ? "#3B82F6" : s === 'F' ? "#EC4899" : "#9CA3AF")),
        // PHOTO
        $(go.Picture, {
          margin: 4,
          width: 50,
          height: 50,
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
          font: "bold 18px sans-serif",
          stroke: "#6366F1",
          visible: false,
          background: "#E0E7FF",
          width: 50,
          height: 50,
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
          font: "bold 12px sans-serif",
          stroke: "#1E293B",
          textAlign: "center",
          maxSize: new go.Size(100, NaN),
          wrap: go.TextBlock.WrapFit
        }, new go.Binding("text", "", d => {
          if (d && d.first_name && d.last_name) {
            return `${d.first_name} ${d.last_name}`;
          }
          return "";
        })),
        // OCCUPATION (plus petite pour la vue radiale)
        $(go.TextBlock, {
          margin: new go.Margin(2, 0, 0, 0),
          font: "10px sans-serif",
          stroke: "#64748B",
          textAlign: "center",
          maxSize: new go.Size(100, NaN),
          wrap: go.TextBlock.WrapFit
        }, new go.Binding("text", "occupation", v => v || ""))
      )
    );

    // Link template - plus courbé pour la vue radiale
    diagram.linkTemplate = $(
      go.Link,
      {
        curve: go.Link.Bezier,
        curviness: 20,
        relinkableFrom: false,
        relinkableTo: false,
        reshapable: false,
        resegmentable: false,
        toShortLength: 4
      },
      $(go.Shape, { 
        stroke: "#A5B4FC", 
        strokeWidth: 1.5,
        strokeDashArray: null
      }),
      $(go.Shape, { 
        toArrow: "OpenTriangle", 
        fill: "#A5B4FC", 
        stroke: "#A5B4FC",
        scale: 0.7
      })
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
      console.log('Radial diagram div not found');
      return;
    }
    
    if (diagramInitializedRef.current) {
      console.log('Radial diagram already initialized');
      return;
    }
    
    try {
      console.log('Initializing radial diagram');
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
        console.log('Cleaning up radial diagram');
        window.removeEventListener('resize', handleResize);
        
        // Nettoyer proprement le diagramme
        if (diagram) {
          try {
            diagram.clear();
            diagram.div = null;
          } catch (error) {
            console.error('Error cleaning up radial diagram:', error);
          }
        }
        
        diagramRef.current = null;
        diagramInitializedRef.current = false;
      };
    } catch (error) {
      console.error("Erreur lors de l'initialisation du diagramme radial:", error);
      diagramInitializedRef.current = false;
    }
  }, [createDiagram]);

  // Mise à jour du modèle lorsque les données changent
  useEffect(() => {
    // Récupérer l'instance du diagramme depuis la référence
    const diagram = diagramRef.current;
    
    // Ne rien faire s'il n'y a pas de diagramme ou pas de données
    if (!diagram || !familyMembers.length) {
      console.log('No diagram or no family members to display in radial view');
      return;
    }
    
    try {
      console.log(`Updating radial diagram with ${familyMembers.length} family members`);
      
      // Filtrer pour s'assurer que seuls les membres liés à la personne sélectionnée sont affichés
      const relevantMembers = selectedPerson 
        ? familyMembers.filter(member => 
            // Inclure la personne sélectionnée et ses relations directes
            member.id === selectedPerson.id || 
            member.father_id === selectedPerson.id || 
            member.mother_id === selectedPerson.id ||
            (selectedPerson.father_id && member.id === selectedPerson.father_id) ||
            (selectedPerson.mother_id && member.id === selectedPerson.mother_id)
          )
        : familyMembers;
      
      console.log(`Displaying ${relevantMembers.length} members in radial view`);
      
      // Préparer les données pour le modèle
      const nodeDataArray = relevantMembers.map((person) => {
        let parentKey: string | undefined;
        
        // Définir la relation parent-enfant pour l'arbre
        if (person.father_id && relevantMembers.some(m => m.id === person.father_id)) {
          parentKey = person.father_id;
        } else if (person.mother_id && relevantMembers.some(m => m.id === person.mother_id)) {
          parentKey = person.mother_id;
        }
        
        // Si rootPerson, force la racine à ne pas avoir de parent
        if (rootPerson && person.id === rootPerson.id) {
          parentKey = undefined;
        }
        
        return {
          ...person,
          key: person.id,
          ...(parentKey ? { parent: parentKey } : {})
        };
      });
      
      // Mettre à jour le modèle de façon sécurisée
      diagram.model = new go.TreeModel(nodeDataArray);
      
      // Sélectionner la personne si sélectionnée
      if (selectedPerson) {
        const part = diagram.findPartForKey(selectedPerson.id);
        if (part) diagram.select(part);
      }
      
      // Ajuster le zoom
      diagram.zoomToFit();
    } catch (error) {
      console.error("Erreur lors de la mise à jour du diagramme radial:", error);
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
            Cette vue radiale utilise GoJS pour visualiser les relations familiales de manière circulaire.
          </div>
        </div>
      )}
    </div>
  );
};

export default RadialTreeGoJS;
