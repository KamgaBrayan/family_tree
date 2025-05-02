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
      layout: $(go.TreeLayout, {
        angle: 90,
        layerSpacing: 50,
        nodeSpacing: 30,
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

    // Link template
    diagram.linkTemplate = $(
      go.Link,
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
      }),
      $(go.Shape, { 
        toArrow: "Standard", 
        fill: "#A5B4FC", 
        stroke: "#A5B4FC",
        scale: 0.8
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
